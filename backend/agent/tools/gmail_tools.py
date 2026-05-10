# backend/agent/tools/gmail_tools.py
from langchain_core.tools import tool
from backend.services import gmail_service
from backend.agent.tools.base_tool import get_access_token, get_permissions

@tool
async def search_emails(query: str, max_results: int = 20) -> str:
    """
    Search Gmail inbox using a query string.
    Use when the user asks to find, list, or show emails.
    Supports Gmail search operators: from:, to:, subject:, is:unread, is:important, older_than:7d
    Args:
        query: Gmail search query e.g. 'from:linkedin.com is:unread'
        max_results: maximum number of results (default 20, max 50)
    Returns: formatted list of email threads with sender, subject, date
    """
    token = get_access_token()
    threads = await gmail_service.search_threads(token, query, min(max_results, 50))
    if not threads:
        return f"No emails found matching '{query}'."

    lines = [f"Found {len(threads)} emails:"]
    for t in threads[:20]:
        read_status = "📭 " if t.is_read else "📬 "
        sender = t.from_contact.name or t.from_contact.email
        lines.append(f"{read_status}[{t.id}] From: {sender} | {t.subject} | {t.date}")
    return "\n".join(lines)

@tool
async def count_emails(query: str) -> str:
    """
    Count emails matching a query WITHOUT deleting them.
    ALWAYS call this before delete_emails to show the user the count first.
    Args:
        query: Gmail search query
    Returns: count string e.g. "Found 847 emails matching 'from:linkedin.com'"
    """
    token = get_access_token()
    threads = await gmail_service.search_threads(token, query, 500)
    return f"Found {len(threads)} emails matching '{query}'. Thread IDs available for bulk action."

@tool
async def delete_emails(query: str, confirmed: bool = False) -> str:
    """
    Delete emails matching a query from Gmail.
    CRITICAL SAFETY RULES:
    1. ALWAYS call count_emails first to show the user how many will be deleted
    2. ALWAYS ask for explicit confirmation before deleting
    3. Only call this tool with confirmed=True after user has confirmed
    4. If confirmed=False, return the confirmation request message instead
    Args:
        query: Gmail search query e.g. 'from:linkedin.com older_than:30d'
        confirmed: Must be True — only set after user explicitly confirms
    Returns: deletion confirmation or confirmation request
    """
    permissions = get_permissions()
    if not permissions.get('can_delete_emails', False):
        return "Permission denied: Email deletion is disabled. User can enable it in Settings > Permissions."

    if not confirmed:
        return f"NEEDS_CONFIRMATION: About to delete emails matching '{query}'. Please confirm with the user first."

    token = get_access_token()
    threads = await gmail_service.search_threads(token, query, 500)
    thread_ids = [t.id for t in threads]

    if not thread_ids:
        return "No emails found matching that query. Nothing deleted."

    count = await gmail_service.delete_threads(token, thread_ids)
    return f"✅ Deleted {count} emails matching '{query}'."

@tool
async def archive_emails(query: str) -> str:
    """
    Archive emails matching a query (removes from inbox, keeps in All Mail).
    Safer than deleting — use this when user wants to clean up inbox without permanent deletion.
    Args:
        query: Gmail search query
    Returns: confirmation with count archived
    """
    token = get_access_token()
    threads = await gmail_service.search_threads(token, query, 500)
    thread_ids = [t.id for t in threads]

    if not thread_ids:
        return "No emails found matching that query."

    await gmail_service.archive_threads(token, thread_ids)
    return f"✅ Archived {len(thread_ids)} emails."

@tool
async def mark_emails_as_read(query: str) -> str:
    """
    Mark emails matching a query as read.
    Use when user asks to mark emails as read or clear unread count.
    Args:
        query: Gmail search query
    Returns: confirmation with count marked
    """
    token = get_access_token()
    threads = await gmail_service.search_threads(token, query, 200)
    thread_ids = [t.id for t in threads]

    if not thread_ids:
        return "No unread emails found."

    await gmail_service.mark_as_read(token, thread_ids)
    return f"✅ Marked {len(thread_ids)} emails as read."

@tool
async def draft_email_reply(thread_id: str, reply_content: str) -> str:
    """
    Create a draft reply to an email thread.
    Use when user asks to reply to, respond to, or draft a response to an email.
    Does NOT send — only creates a draft.
    Args:
        thread_id: Gmail thread ID from search_emails results
        reply_content: the reply text to draft
    Returns: confirmation with draft ID
    """
    token = get_access_token()
    draft_id = await gmail_service.create_draft(token, thread_id, reply_content)
    return f"✅ Draft created (ID: {draft_id}). Review it in Gmail before sending."

GMAIL_TOOLS = [search_emails, count_emails, delete_emails, archive_emails, mark_emails_as_read, draft_email_reply]
