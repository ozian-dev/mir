import threading
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.conf import log
from app.job import run
from app.util import util_push

class JSONFileChangeHandler(FileSystemEventHandler):
    def __init__(self, filepath, on_change_callback):
        self.filepath = os.path.abspath(filepath)
        self.on_change_callback = on_change_callback
    
    def on_modified(self, event):
        if not event.is_directory:
            if os.path.abspath(event.src_path) == self.filepath:
                log.log_info('root', f"Conf file changed: {event.src_path}")
                util_push.check_ready()
                run.every_hour()
                self.on_change_callback()
                util_push.check_ready()

def start_file_watcher(filepath, on_change_callback):
    event_handler = JSONFileChangeHandler(filepath, on_change_callback)
    observer = Observer()
    watch_dir = os.path.dirname(os.path.abspath(filepath))
    if not watch_dir: watch_dir = '.'
    
    observer.schedule(event_handler, path=watch_dir, recursive=False)
    observer.start()
    
    return observer