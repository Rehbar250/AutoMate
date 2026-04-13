# AutoMate Deployment & Configuration Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy the AutoMate Sync Agent in a production environment. Follow these steps to ensure secure authentication and reliable data synchronization.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- An **Azure Subscription** with permissions to register applications in Microsoft Entra ID.
- Access to the **SharePoint Online** site and list you wish to sync.
- A **Power BI Pro** or **Premium** workspace.
- **Python 3.9+** or **Docker** installed on your target deployment server.

---

## 🔐 Phase 1: Microsoft Entra ID (Azure AD) Setup

The Sync Agent uses a "Service Principal" (App-only) to authenticate.

1.  **Register the Application**:
    - Go to the [Azure Portal](https://portal.azure.com) > **Microsoft Entra ID** > **App registrations**.
    - Click **New registration**.
    - Name it `AutoMate Sync Agent`. Select "Accounts in this organizational directory only".
    - Click **Register**. Copy the **Application (client) ID** and **Directory (tenant) ID**.

2.  **Create a Client Secret**:
    - In your App Registration, go to **Certificates & secrets** > **Client secrets**.
    - Click **New client secret**. Give it a description (e.g., `SyncService`) and an expiry (e.g., 24 months).
    - **IMPORTANT**: Copy the **Value** of the secret immediately. You will not be able to see it again.

3.  **Configure API Permissions**:
    - Go to **API permissions** > **Add a permission**.
    - **Microsoft Graph**: Select **Application permissions**. Search for and add:
        - `Sites.Read.All` (Allows the agent to read SharePoint data).
    - **Power BI Service**: Select **Application permissions**. Search for and add:
        - `Dataset.ReadWrite.All` (Allows the agent to refresh/push data).
    - **IMPORTANT**: Click **Grant admin consent for [Your Org]** to activate these permissions.

---

## 🆔 Phase 2: Collecting SharePoint & Power BI IDs

You must update `config.json` with the following unique identifiers.

### Finding SharePoint IDs
- **Site ID**: Use the Graph Explorer or visit `https://<your-tenant>.sharepoint.com/sites/<your-site>/_api/site/id` to find the GUID. A common way is using the URL: `https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/<site-name>`.
- **List ID**: Go to your SharePoint List > **List Settings**. The List ID (GUID) is in the URL between `%7B` and `%7D`.

### Finding Power BI IDs
- **Workspace ID**: Open your workspace in the browser. The ID is the GUID in the URL after `/groups/`.
- **Dataset ID**: Open your dataset settings. The ID is the GUID in the URL after `/datasets/`.

---

## 🚀 Phase 3: Deployment Options

### Option A: Local / Virtual Machine (Systemd Service)
Best for testing or running on an internal company server.

1.  **Prepare the Environment**:
    ```bash
    git clone <your-repo-url> /opt/automate
    cd /opt/automate
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
2.  **Configure Secrets**:
    ```bash
    cp .env.example .env
    # Edit .env and config.json with your credentials from Phase 1 & 2
    ```
3.  **Setup Systemd Service**:
    Create `/etc/systemd/system/automate.service`:
    ```ini
    [Unit]
    Description=AutoMate Sync Agent Dashboard
    After=network.target

    [Service]
    User=root
    WorkingDirectory=/opt/automate
    ExecStart=/opt/automate/venv/bin/python -m src.main
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```
4.  **Launch**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable automate
    sudo systemctl start automate
    ```

---

### Option B: Cloud-Native (Azure Container Apps)
Best for high availability and scalability.

1.  **Push Image to Azure Container Registry (ACR)**:
    ```bash
    az acr login --name <your ACR name>
    docker build -t automate-agent .
    docker tag automate-agent <your ACR>.azurecr.io/automate-agent:v1
    docker push <your ACR>.azurecr.io/automate-agent:v1
    ```
2.  **Create Container App**:
    - In Azure Portal, search for **Container Apps**.
    - Create a new App. In the **Container** tab, select your ACR image.
    - **Ingress**: Enable Ingress, set to "External" and target port `8000`.
    - **Secrets & Env Vars**: Add `TENANT_ID`, `CLIENT_ID`, and `CLIENT_SECRET` as environment variables.
3.  **Access Dashboard**: The app will provide a URL (e.g., `https://automate.blue-sea-123.azurecontainerapps.io`). Visit this to see your live sync logs!

---

## 🛠️ Phase 4: Verification

1.  Open the **AutoMate Dashboard** (local: `http://localhost:8000`).
2.  Verify that the **Agent Status** shows "Active" or "Success".
3.  Click **Sync Now** to test the connection.
4.  Check the **Terminal Logs** section on the dashboard for any authentication or connection errors.
5.  Confirm in **Power BI Service** that the "Last Refresh" timestamp has updated.

