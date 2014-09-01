from django.shortcuts import render, render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.template.loader import render_to_string
from django.template import RequestContext
import json
import sys
import StringIO
from Bio import SeqIO
import SeqToJSON
import dropbox
from dropbox.client import DropboxOAuth2Flow

# Create your views here.

def index(request):
    return HttpResponse("Hello, world.  You're at the poll index.")

def detail(request, poll_id):
    return HttpResponse("You're looking at poll %s."%poll_id)

def results(request, poll_id):
    return HttpResponse("You're looking at the results of poll %s."%poll_id)

def vote(request,poll_id):
    return HttpResponse("You're voting on poll %s." % poll_id)

def registerdropbox(request):
	flow=get_dropbox_auth_flow(request.session)
	print request.session.keys()
	print request.session['dropbox-auth-csrf-token']
	try:
		access_token, user_id, url_state=flow.finish(request.GET)
		request.session['access_token']=access_token
		request.session['user_id']=user_id
		print user_id
		print "dai seikou!"
	except DropboxOAuth2Flow.BadRequestException, e:
		return http_status(400)
	except DropboxOAuth2Flow.BadStateException, e:
		return HttpResponseRedirect("http://www.mydomain.com/dropbox_auth_start")
	except DropboxOAuth2Flow.CsrfException, e:
		return HttpResponseForbidden()
	except DropboxOAuth2Flow.NotApprovedException, e:
		raise e
	except DropboxOAuth2Flow.ProviderException, e:
		raise e
	except dropbox.rest.ErrorResponse, e:
		print 'exception'
		print e.error_msg
	return HttpResponseRedirect('kineticjstest.html')

def testjsp(request):
    return render_to_response('testjsp.jsp')

def ajaxresponse(request):
	data={}
	data['producer']='samsung'
	data['model']='razr'
	data['price']=5
	return HttpResponse(json.dumps(data), content_type='application/json')

def simpletest(request):
	return render(request, 'simpletest.html')

def get_dropbox_auth_flow(session):
	app_key='p7b7j5v29v38bnk'
	app_secret='q83heifozbsktdy'
	return dropbox.client.DropboxOAuth2Flow(app_key,app_secret,"http://localhost:8000/polls/registerdropbox",session,"dropbox-auth-csrf-token")

def getlist(request):
	data=[]
	try:
		client=dropbox.client.DropboxClient(request.session['access_token'])
		folder_metadata=client.metadata('/')
		for obj in folder_metadata['contents']:
			data.append([obj['path'],obj['size']])
	except:
		print 'Exception'
	return HttpResponse(json.dumps(data),content_type='application/json')


def kineticjstest(request):
	try:
		client=dropbox.client.DropboxClient(request.session['access_token'])
		folder_metadata=client.metadata('/')
	except:
		flow=get_dropbox_auth_flow(request.session)
		return HttpResponseRedirect(flow.start())
	return render(request, 'kineticjstest.html')
#	return render_to_response('kineticjstest.html', RequestContext(request))

def getsequence(request):
	absolute_path=request.POST['name']
	try:
		client=dropbox.client.DropboxClient(request.session['access_token'])
		with client.get_file(absolute_path) as f:
			s=f.read()
	except:
		print 'Exception'
	#s=render_to_string(absolute_path[1:])
	seq=SeqIO.read(StringIO.StringIO(s), "genbank")
	output=StringIO.StringIO()
	SeqIO.write(seq, output, "json")
	jsonstring=output.getvalue()
	print jsonstring
	return HttpResponse(jsonstring[2:-2], content_type='application/json')
