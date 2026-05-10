# backend/services/gmail_service.py
import base64
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from backend.models.gmail import EmailThread, EmailContact

def _get_gmail_service(access_token: str):
    credentials = Credentials(token=access_token)
    return build('gmail', 'v1', credentials=credentials)

async def search_threads(access_token: str, query: str, max_results: int = 30) -> list[EmailThread]:
    service = _get_gmail_service(access_token)
    response = service.users().threads().list(
        userId='me', q=query, maxResults=max_results
    ).execute()

    raw_threads = response.get('threads', [])
    parsed_threads = []

    for raw in raw_threads:
        # format=metadata skips downloading email bodies (much faster than format=full).
        # No metadataHeaders filter — let Gmail return its default common headers
        # (From, To, Cc, Bcc, Subject) to avoid serialisation quirks with the Python client.
        t_data = service.users().threads().get(
            userId='me',
            id=raw['id'],
            format='metadata',
        ).execute()

        messages = t_data.get('messages', [])
        if not messages:
            continue

        # Use the FIRST message for From/Subject: original sender of the thread.
        # The last message might be the user's own reply, which shows their own address.
        first_msg = messages[0]
        headers = first_msg.get('payload', {}).get('headers', [])
        header_map = {h['name'].lower(): h['value'] for h in headers}

        # Debug: log available headers so you can verify From is returned
        print(f"[gmail] thread {raw['id']}: header keys={list(header_map.keys())[:8]}")

        from_header = header_map.get('from', '')
        name, email = from_header, from_header
        if '<' in from_header:
            name_part, email_part = from_header.split('<', 1)
            name = name_part.strip().strip('"') or email_part.replace('>', '').strip()
            email = email_part.replace('>', '').strip()

        # Read/starred status comes from the last (newest) message's labels
        last_msg = messages[-1]
        label_ids = last_msg.get('labelIds', [])

        parsed_threads.append(EmailThread(
            id=t_data['id'],
            subject=header_map.get('subject', 'No Subject'),
            snippet=t_data.get('snippet', ''),
            from_contact=EmailContact(email=email, name=name),
            date=header_map.get('date', ''),
            is_read='UNREAD' not in label_ids,
            is_starred='STARRED' in label_ids,
            labels=label_ids,
            message_count=len(messages)
        ))

    return parsed_threads

async def delete_threads(access_token: str, thread_ids: list[str]) -> int:
    service = _get_gmail_service(access_token)
    
    # We delete threads individually (batch process might be better for huge numbers)
    count = 0
    for t_id in thread_ids:
        service.users().threads().trash(userId='me', id=t_id).execute()
        count += 1
        
    return count

async def archive_threads(access_token: str, thread_ids: list[str]) -> None:
    service = _get_gmail_service(access_token)
    for t_id in thread_ids:
        service.users().threads().modify(
            userId='me', id=t_id,
            body={'removeLabelIds': ['INBOX']}
        ).execute()

async def mark_as_read(access_token: str, thread_ids: list[str]) -> None:
    service = _get_gmail_service(access_token)
    for t_id in thread_ids:
        service.users().threads().modify(
            userId='me', id=t_id,
            body={'removeLabelIds': ['UNREAD']}
        ).execute()

async def create_draft(access_token: str, thread_id: str, content: str) -> str:
    service = _get_gmail_service(access_token)
    
    # Needs to get the thread info to construct a proper reply (In-Reply-To, References)
    # For MVP, just creating a new message draft in the thread
    
    message = EmailMessage()
    message.set_content(content)
    
    # Get original message to set headers properly
    thread = service.users().threads().get(userId='me', id=thread_id).execute()
    last_message = thread['messages'][-1]
    headers = last_message['payload']['headers']
    
    subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
    if not subject.lower().startswith('re:'):
        subject = f"Re: {subject}"
        
    to_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
    msg_id = next((h['value'] for h in headers if h['name'].lower() == 'message-id'), '')
    references = next((h['value'] for h in headers if h['name'].lower() == 'references'), msg_id)
    
    message['To'] = to_header
    message['Subject'] = subject
    message['In-Reply-To'] = msg_id
    message['References'] = references
    
    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    create_message = {
        'message': {
            'raw': encoded_message,
            'threadId': thread_id
        }
    }
    
    draft = service.users().drafts().create(userId='me', body=create_message).execute()
    return draft['id']
