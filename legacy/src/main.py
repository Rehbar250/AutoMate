import json
import time
import threading
import schedule
import pandas as pd
from typing import Dict, Any

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.logger import get_logger
from src.sharepoint_client import SharePointClient
from src.data_processor import DataProcessor
from src.powerbi_client import PowerBIClient

logger = get_logger("Main")

app = FastAPI(title="AutoMate Control Dashboard")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="src/static"), name="static")
templates = Jinja2Templates(directory="src/templates")

# Global state tracker
SYNC_RUNNING = False
LAST_SYNC_TIME = "Never"
LAST_SYNC_STATUS = "Idle"

def load_config() -> Dict[str, Any]:
    try:
        with open("config.json", "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load config.json: {e}")
        return {}

def execute_sync():
    global SYNC_RUNNING, LAST_SYNC_TIME, LAST_SYNC_STATUS
    if SYNC_RUNNING:
        logger.warning("Sync already in progress. Skipping.")
        return

    SYNC_RUNNING = True
    LAST_SYNC_STATUS = "Running..."
    logger.info("--- Starting Sync Job ---")
    config = load_config()

    try:
        sp_config = config.get("sharepoint", {})
        sp_client = SharePointClient(
            site_id=sp_config.get("site_id"),
            list_id=sp_config.get("list_id"),
            select_fields=sp_config.get("select_fields", [])
        )
        
        dp_config = config.get("data_processing", {})
        processor = DataProcessor(dp_config)
        
        pbi_config = config.get("powerbi", {})
        pbi_client = PowerBIClient(pbi_config)

        # 1. Fetch from SharePoint
        raw_data = sp_client.get_list_items()
        
        if not raw_data:
            logger.info("No data found to process.")
        else:
            # 2. Process and Clean Data
            cleaned_df = processor.process_data(raw_data)
            
            if not cleaned_df.empty:
                # 3. Output Locally (Backup)
                backup_path = "latest_sync.csv"
                cleaned_df.to_csv(backup_path, index=False)
                logger.debug(f"Saved local backup to {backup_path}")

                # 4. Push/Refresh Power BI
                pbi_client.push_data(cleaned_df)
                pbi_client.trigger_refresh()

        logger.info("--- Sync Job Completed Successfully ---")
        LAST_SYNC_STATUS = "Success"

    except Exception as e:
        logger.exception(f"Sync Job failed with error: {e}")
        LAST_SYNC_STATUS = "Error"
    finally:
        LAST_SYNC_TIME = time.strftime("%Y-%m-%d %H:%M:%S")
        SYNC_RUNNING = False

def run_scheduler():
    config = load_config()
    interval = config.get("sharepoint", {}).get("polling_interval_minutes", 5)
    logger.info(f"Background scheduler started. Polling every {interval} minutes.")
    
    schedule.every(interval).minutes.do(execute_sync)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

@app.on_event("startup")
def startup_event():
    # Write a clean start to log
    with open("sync.log", "a") as f:
        f.write(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] --- AutoMate Dashboard Server Started ---\n")
        
    start_scheduler = threading.Thread(target=run_scheduler, daemon=True)
    start_scheduler.start()
    
    # Run an initial sync purely in background
    init_sync = threading.Thread(target=execute_sync, daemon=True)
    init_sync.start()

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/status")
async def get_status():
    return JSONResponse({
        "status": LAST_SYNC_STATUS,
        "lastRun": LAST_SYNC_TIME,
        "isRunning": SYNC_RUNNING
    })

@app.post("/api/sync")
async def trigger_sync():
    if SYNC_RUNNING:
        return JSONResponse({"message": "Sync is already running."}, status_code=400)
    
    t = threading.Thread(target=execute_sync, daemon=True)
    t.start()
    return JSONResponse({"message": "Sync job initiated successfully."})

@app.get("/api/logs")
async def get_logs():
    try:
        with open("sync.log", "r") as f:
            # Send latest 200 lines
            lines = f.readlines()[-200:]
            return JSONResponse({"logs": "".join(lines)})
    except FileNotFoundError:
        return JSONResponse({"logs": "Waiting for sync.log to generate..."})

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Web UI Dashboard on http://localhost:8000")
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
