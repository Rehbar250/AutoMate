import pandas as pd
from typing import Dict, Any
from src.logger import get_logger

logger = get_logger("DataProcessor")

class DataProcessor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
    def process_data(self, raw_data: list[dict]) -> pd.DataFrame:
        if not raw_data:
            logger.warning("No data received to process.")
            return pd.DataFrame()
            
        logger.info("Starting data processing layer.")
        df = pd.DataFrame(raw_data)
        
        logger.debug(f"DataFrame loaded with {len(df)} rows.")
        
        # 1. Drop duplicates
        subset = self.config.get("drop_duplicates_subset", [])
        if subset:
            # We must only check subset if they exist in df
            existing_subset = [col for col in subset if col in df.columns]
            if existing_subset:
                before_count = len(df)
                df.drop_duplicates(subset=existing_subset, inplace=True)
                after_count = len(df)
                logger.info(f"Dropped {before_count - after_count} duplicate rows based on subset {existing_subset}.")

        # 2. Fill Missing Values
        fillna_values = self.config.get("fillna_values", {})
        for col, fill_val in fillna_values.items():
            if col in df.columns:
                null_count = df[col].isna().sum()
                if null_count > 0:
                    df[col].fillna(fill_val, inplace=True)
                    logger.debug(f"Filled {null_count} missing values in column '{col}' with '{fill_val}'.")
                    
        # 3. Standardize column names and types
        # Power BI Push Datasets cannot handle nested json objects
        for col in df.columns:
            # Convert dicts or lists to string representations
            df[col] = df[col].apply(lambda x: str(x) if isinstance(x, (dict, list)) else x)
            # Ensure none is represented properly (or empty)
            df[col].fillna("", inplace=True)
            
        logger.info("Data processing completed successfully.")
        return df
