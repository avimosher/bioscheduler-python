from __future__ import absolute_import
from celery import shared_task, current_task, task
from time import sleep
from mysite.celery import app
import subprocess

@shared_task
def test2(param):
    for i in range(100):
        sleep(0.1)
        current_task.update_state(state='PROGRESS',meta={'current': i, 'total': 100})
    cmd_out=""
    try:
        cmd=subprocess.Popen(['echo','$PATH'],stdout=subprocess.PIPE)
        cmd_out,cmd_err=cmd.communicate()
        current_task.update_state(state='SUCCESS')
    except Exception as e:
        print(str(e))
       	traceback.print_exc()
       	raise e
    return cmd_out.decode('ascii')
#    return 'The test task executed with argument "%s" '%param
