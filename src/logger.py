import logging
import os
import colorlog
from dotenv import load_dotenv

load_dotenv()

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    
    # Only configure if no handlers exist (avoid duplicate logs)
    if not logger.handlers:
        level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        level = getattr(logging, level_str, logging.INFO)
        logger.setLevel(level)

        handler = logging.StreamHandler()
        
        formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Add a FileHandler for the dashboard to read
        file_handler = logging.FileHandler("sync.log", mode='a')
        file_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
    return logger
