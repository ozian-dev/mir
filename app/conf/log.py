import logging
import json

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

###############################
# logger functions
###############################
def log(log_name: str, mode: str, msg, extra: object = None):

    logger = get_logger(log_name)

    log_str = msg
    if isinstance(msg, dict):
        log_str = (
            f"[{log_name}]\t"
            + msg.get("@ip", "-") + "\t"
            + msg.get("@id", "-") + "\t"
            + msg.get("@level", "-") + "\t"
            + json.dumps(msg, ensure_ascii=False)
        )
    
    if mode == 'info': logger.info(log_str)
    elif mode == 'warning': logger.warning(log_str)
    elif mode == 'error': logger.error(log_str)
    elif mode == 'critical': logger.critical(log_str)
    else: logger.debug(log_str)

def log_info(log_name: str, msg, extra: object = None):
    log(log_name, 'info', msg, extra)

def log_warn(log_name: str, msg, extra: object = None):
    log(log_name, 'warning', msg, extra)

def log_error(log_name: str, msg, extra: object = None):
    log(log_name, 'error', msg, extra)

def log_debug(log_name: str, msg, extra: object = None):
    log(log_name, 'debug', msg, extra)

