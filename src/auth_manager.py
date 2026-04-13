import os
import msal
from dotenv import load_dotenv
from src.logger import get_logger

load_dotenv()
logger = get_logger("AuthManager")

class AuthManager:
    def __init__(self):
        self.tenant_id = os.getenv("TENANT_ID")
        self.client_id = os.getenv("CLIENT_ID")
        self.client_secret = os.getenv("CLIENT_SECRET")
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            logger.error("Missing critical environment variables for Authentication.")
            # We don't want to crash on import/startup if .env is just missing in the example,
            # but it will crash when trying to authenticate.
            self.is_configured = False
        else:
            self.is_configured = True
            
            self.app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret,
            )

    def get_access_token(self, scopes: list[str]) -> str:
        """
        Acquire token for specific scopes.
        Graph API Scope: ['https://graph.microsoft.com/.default']
        Power BI Scope: ['https://analysis.windows.net/powerbi/api/.default']
        """
        if not self.is_configured:
            raise ValueError("Authentication credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are not set.")

        logger.debug(f"Acquiring access token for scopes: {scopes}")
        result = self.app.acquire_token_silent(scopes, account=None)
        
        if not result:
            logger.debug("No valid token found in cache. Acquiring new token from AAD.")
            result = self.app.acquire_token_for_client(scopes=scopes)
            
        if "access_token" in result:
            logger.debug("Successfully acquired access token.")
            return result["access_token"]
        else:
            logger.error(f"Failed to acquire token. Error: {result.get('error')} - {result.get('error_description')}")
            raise Exception("Authentication failed.")
