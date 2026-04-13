# AutoMate: SharePoint to Power BI Sync Agent

A production-ready Python automation agent designed to synchronize Data from Microsoft SharePoint lists to Power BI. It automatically polls SharePoint, cleans and validates the data, and pushes it directly into Power BI datasets in near real-time.

## Features
- **Microsoft Entra ID OAuth2**: App-only authentication using Service Principals.
- **Data Processing Layer**: Utilizes `pandas` to validate, deduplicate, and handle missing values.
- **Dual Mode Power BI Integration**: Can explicitly push to Power BI streaming datasets or trigger dataset refreshes.
- **Plug-and-play Configuration**: Adjust settings, mapping, and schemas using `config.json`.

## Setup

1. **Install Python 3.9+**
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Entra ID application credentials.
   ```bash
   cp .env.example .env
   ```
4. **Configure application in `config.json`**:
   Fill in your `site_id`, `list_id`, `workspace_id`, and `dataset_id`.

## Usage

Run the agent locally:

```bash
python -m src.main
```

The system will execute an immediate sync and then begin scheduling polls based on the `polling_interval_minutes` defined in your config.
