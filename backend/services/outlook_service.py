# backend/services/outlook_service.py
import httpx

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
_SELECT = "id,subject,from,toRecipients,bodyPreview,receivedDateTime,isRead,conversationId"

def _transform(item: dict) -> dict:
    fc = (item.get("from") or {}).get("emailAddress", {})
    to = [
        {"email": r["emailAddress"].get("address", ""), "name": r["emailAddress"].get("name")}
        for r in item.get("toRecipients", [])
        if "emailAddress" in r
    ]
    return {
        "id": item.get("id", ""),
        "subject": item.get("subject") or "(No Subject)",
        "snippet": item.get("bodyPreview", ""),
        "from_contact": {"email": fc.get("address", ""), "name": fc.get("name")},
        "to": to,
        "date": item.get("receivedDateTime", ""),
        "is_read": item.get("isRead", False),
        "is_starred": False,
        "labels": [],
        "source": "outlook",
        "message_count": 1,
    }

async def get_inbox_messages(access_token: str, max_results: int = 30) -> list[dict]:
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    params = {"$top": max_results, "$select": _SELECT, "$orderby": "receivedDateTime desc"}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{GRAPH_BASE}/me/mailFolders/inbox/messages",
            headers=headers, params=params
        )

    if resp.status_code != 200:
        raise Exception(f"Microsoft Graph mail error {resp.status_code}: {resp.text}")

    return [_transform(item) for item in resp.json().get("value", [])]

async def search_messages(access_token: str, query: str, max_results: int = 30) -> list[dict]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "ConsistencyLevel": "eventual",
    }
    params = {"$top": max_results, "$select": _SELECT, "$search": f'"{query}"'}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{GRAPH_BASE}/me/messages", headers=headers, params=params)

    if resp.status_code != 200:
        raise Exception(f"Microsoft Graph search error {resp.status_code}: {resp.text}")

    return [_transform(item) for item in resp.json().get("value", [])]
