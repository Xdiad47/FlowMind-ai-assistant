# backend/services/gmail_service.py
import base64
from email.message import EmailMessage
import httpx
from backend.models.gmail import EmailThread, EmailContact

_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"


def _headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def _raise_for_google_error(resp: httpx.Response) -> None:
    if resp.status_code == 401:
        raise Exception("401 Google token invalid or expired — please sign out and sign back in.")
    if resp.status_code == 403:
        raise Exception("403 Gmail access denied — please sign out and sign back in to re-grant permissions.")
    resp.raise_for_status()


async def search_threads(access_token: str, query: str, max_results: int = 30) -> list[EmailThread]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{_BASE}/threads",
            headers=_headers(access_token),
            params={"q": query, "maxResults": max_results},
        )
        _raise_for_google_error(resp)
        raw_threads = resp.json().get("threads", [])

        parsed_threads = []
        for raw in raw_threads:
            t_resp = await client.get(
                f"{_BASE}/threads/{raw['id']}",
                headers=_headers(access_token),
                params={
                    "format": "metadata",
                    "metadataHeaders": ["From", "Subject", "Date", "To"],
                },
            )
            _raise_for_google_error(t_resp)
            t_data = t_resp.json()

            messages = t_data.get("messages", [])
            if not messages:
                continue

            first_msg = messages[0]
            header_list = first_msg.get("payload", {}).get("headers", [])
            header_map = {h["name"].lower(): h["value"] for h in header_list}

            from_header = header_map.get("from", "")
            name, email = from_header, from_header
            if "<" in from_header:
                name_part, email_part = from_header.split("<", 1)
                name = name_part.strip().strip('"') or email_part.replace(">", "").strip()
                email = email_part.replace(">", "").strip()

            last_msg = messages[-1]
            label_ids = last_msg.get("labelIds", [])

            parsed_threads.append(EmailThread(
                id=t_data["id"],
                subject=header_map.get("subject", "No Subject"),
                snippet=t_data.get("snippet", ""),
                from_contact=EmailContact(email=email, name=name),
                date=header_map.get("date", ""),
                is_read="UNREAD" not in label_ids,
                is_starred="STARRED" in label_ids,
                labels=label_ids,
                message_count=len(messages),
            ))

        return parsed_threads


async def delete_threads(access_token: str, thread_ids: list[str]) -> int:
    async with httpx.AsyncClient(timeout=30) as client:
        count = 0
        for t_id in thread_ids:
            resp = await client.post(
                f"{_BASE}/threads/{t_id}/trash",
                headers=_headers(access_token),
            )
            _raise_for_google_error(resp)
            count += 1
        return count


async def archive_threads(access_token: str, thread_ids: list[str]) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        for t_id in thread_ids:
            resp = await client.post(
                f"{_BASE}/threads/{t_id}/modify",
                headers=_headers(access_token),
                json={"removeLabelIds": ["INBOX"]},
            )
            _raise_for_google_error(resp)


async def mark_as_read(access_token: str, thread_ids: list[str]) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        for t_id in thread_ids:
            resp = await client.post(
                f"{_BASE}/threads/{t_id}/modify",
                headers=_headers(access_token),
                json={"removeLabelIds": ["UNREAD"]},
            )
            _raise_for_google_error(resp)


async def create_draft(access_token: str, thread_id: str, content: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        t_resp = await client.get(
            f"{_BASE}/threads/{thread_id}",
            headers=_headers(access_token),
        )
        _raise_for_google_error(t_resp)
        thread = t_resp.json()

        last_message = thread["messages"][-1]
        headers_list = last_message["payload"]["headers"]

        subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "")
        if not subject.lower().startswith("re:"):
            subject = f"Re: {subject}"
        to_header = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "")
        msg_id = next((h["value"] for h in headers_list if h["name"].lower() == "message-id"), "")
        references = next((h["value"] for h in headers_list if h["name"].lower() == "references"), msg_id)

        message = EmailMessage()
        message.set_content(content)
        message["To"] = to_header
        message["Subject"] = subject
        message["In-Reply-To"] = msg_id
        message["References"] = references

        encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()

        draft_resp = await client.post(
            f"{_BASE}/drafts",
            headers=_headers(access_token),
            json={"message": {"raw": encoded, "threadId": thread_id}},
        )
        _raise_for_google_error(draft_resp)
        return draft_resp.json()["id"]
