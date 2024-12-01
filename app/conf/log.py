import logging
import logging.config

AUDIT_LOG_LEVEL = 50
logging.addLevelName(AUDIT_LOG_LEVEL, "AUDIT")

def custom_level_func(self, message, *args, **kwargs):
    if self.isEnabledFor(AUDIT_LOG_LEVEL):
        self._log(AUDIT_LOG_LEVEL, message, args, **kwargs)

logging.Logger.audit = custom_level_func

logger = logging.getLogger()

def get_logger() :
    return logger
