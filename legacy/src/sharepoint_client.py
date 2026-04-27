import requests
from src.logger import get_logger
from src.auth_manager import AuthManager

logger = get_logger("SharePointClient")

class SharePointClient:
    def __init__(self, site_id: str, list_id: str, select_fields: list[str]):
        self.site_id = site_id
        self.list_id = list_id
        self.select_fields = select_fields
        self.auth_manager = AuthManager()
        self.base_url = "https://graph.microsoft.com/v1.0"
        
    def get_list_items(self) -> list[dict]:
        """
        Fetches items from SharePoint list.
        """
        token = self.auth_manager.get_access_token(["https://graph.microsoft.com/.default"])
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        # Build URL to get items and expand the 'fields' dictionary
        url = f"{self.base_url}/sites/{self.site_id}/lists/{self.list_id}/items?expand=fields"
        
        items = []
        
        logger.info(f"Fetching SharePoint List Items from Site: {self.site_id}, List: {self.list_id}")
        while url:
            logger.debug(f"Calling Graph API: {url}")
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Error fetching SharePoint data: {response.status_code} - {response.text}")
                response.raise_for_status()
                
            data = response.json()
            
            for item in data.get("value", []):
                fields = item.get("fields", {})
                
                # Extract only the keys we care about
                record = {}
                # Include ID and createdDateTime from item root level
                record['sharepoint_item_id'] = item.get("id")
                
                for field in self.select_fields:
                    record[field] = fields.get(field)
                    
                items.append(record)
                
            url = data.get("@odata.nextLink", None)
            
        logger.info(f"Successfully retrieved {len(items)} items from SharePoint.")
        return items
