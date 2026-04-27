import requests
import json
import pandas as pd
from typing import Dict, Any
from src.logger import get_logger
from src.auth_manager import AuthManager

logger = get_logger("PowerBIClient")

class PowerBIClient:
    def __init__(self, config: Dict[str, Any]):
        self.workspace_id = config.get("workspace_id")
        self.dataset_id = config.get("dataset_id")
        self.table_name = config.get("table_name", "RealTimeData")
        self.trigger_refresh_flag = config.get("trigger_refresh", False)
        self.push_mode_flag = config.get("push_mode", True)
        self.auth_manager = AuthManager()
        self.base_url = "https://api.powerbi.com/v1.0/myorg"

    def _get_headers(self):
        token = self.auth_manager.get_access_token(["https://analysis.windows.net/powerbi/api/.default"])
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def push_data(self, df: pd.DataFrame):
        if not self.push_mode_flag:
            logger.info("Push mode is disabled in config. Skipping data push.")
            return

        if df.empty:
            logger.info("DataFrame is empty. Nothing to push to Power BI.")
            return

        headers = self._get_headers()
        url = f"{self.base_url}/groups/{self.workspace_id}/datasets/{self.dataset_id}/tables/{self.table_name}/rows"

        # Convert DataFrame to list of dictionaries (records)
        # Power BI Push datasets expect rows wrapped in a "rows" array
        records = df.to_dict(orient="records")
        payload = {"rows": records}

        logger.info(f"Pushing {len(records)} rows to Power BI dataset {self.dataset_id}...")
        
        response = requests.post(url, headers=headers, json=payload)

        if response.status_code in [200, 202]:
            logger.info("Successfully pushed data to Power BI.")
        else:
            logger.error(f"Failed to push data to Power BI: {response.status_code} - {response.text}")
            response.raise_for_status()

    def trigger_refresh(self):
        if not self.trigger_refresh_flag:
            logger.info("Trigger refresh is disabled in config. Skipping refresh.")
            return

        headers = self._get_headers()
        url = f"{self.base_url}/groups/{self.workspace_id}/datasets/{self.dataset_id}/refreshes"

        logger.info(f"Triggering refresh for Power BI dataset {self.dataset_id}...")
        response = requests.post(url, headers=headers)

        if response.status_code in [200, 202]:
            logger.info("Successfully triggered Power BI dataset refresh.")
        else:
            logger.error(f"Failed to trigger dataset refresh: {response.status_code} - {response.text}")
            response.raise_for_status()
