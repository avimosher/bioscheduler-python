from django.shortcuts import render, render_to_response
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template.loader import render_to_string
from django.template import RequestContext
import json
import sys
import io
from Bio import SeqIO
import polls.SeqToJSON
import dropbox
from dropbox.client import DropboxOAuth2Flow
from xlrd import open_workbook

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
	getdict=request.session
	print("auth",request.session["dropbox-auth-csrf-token"],file=sys.stderr)
	print(dir(getdict),file=sys.stderr)
	getdict['dropbox-auth-csrf-token']=getdict['dropbox-auth-csrf-token'].decode("utf-8")
	try:
		print("REGISTER SUCCESS START",file=sys.stderr)
		access_token, user_id, url_state=flow.finish(request.GET)
		request.session['access_token']=access_token
		request.session['user_id']=user_id
		print("REGISTER SUCCESS",file=sys.stderr)
	except DropboxOAuth2Flow.BadRequestException as e:
		http_status(400)
	except DropboxOAuth2Flow.BadStateException as e:
		# Start the auth flow again.
		return HttpResponseRedirect("http://www.mydomain.com/dropbox_auth_start")
	except DropboxOAuth2Flow.CsrfException as e:
		return HttpResponseForbidden()
	except DropboxOAuth2Flow.NotApprovedException as e:
		raise e
	except DropboxOAuth2Flow.ProviderException as e:
		raise e
	except Exception as e:
		raise e
	print("REGISTERED",file=sys.stderr)
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
#	return dropbox.client.DropboxOAuth2Flow(app_key,app_secret,"https://avimosher.webfactional.com/polls/registerdropbox",session,"dropbox-auth-csrf-token")
	return dropbox.client.DropboxOAuth2Flow(app_key,app_secret,"http://localhost:8000/polls/registerdropbox",session,"dropbox-auth-csrf-token")

def getlist(request):
	data=[]
	try:
		client=dropbox.client.DropboxClient(request.session['access_token'])
		folder_metadata=client.metadata('/')
		for obj in folder_metadata['contents']:
			if (obj['mime_type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'):
				absolute_path=obj['path']
				f=client.get_file(absolute_path)
				s=f.read()
				book=open_workbook(file_contents=s)
				for name in book.sheet_names():
					sheet=book.sheet_by_name(name)
					rows=sheet.nrows
					current_row=2
					while current_row<rows:
						row=sheet.row(current_row)
						name_column=1
						text_entry=1
						if sheet.cell_type(current_row,name_column)!=text_entry:
							break
						name=sheet.cell_value(current_row,name_column)
						sequence_column=4
						sequence=sheet.cell_value(current_row,sequence_column)
						data.append([name,len(sequence),sequence])
						current_row+=1
			else:
				data.append([obj['path'],obj['size'],''])
	except:
		request.session['test']=0
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
	print("get sequence",file=sys.stderr)

	try:
		client=dropbox.client.DropboxClient(request.session['access_token'])
		with client.get_file(absolute_path) as f:
			s=f.read()
	except Exception as e:
		print("exception",file=sys.stderr)
		raise e
	#s=render_to_string(absolute_path[1:])
	output=io.StringIO()
	try:
		seq=SeqIO.read(io.StringIO(s.decode("utf-8")), "genbank")
		#SeqIO.convert(io.StringIO(s.decode("utf-8")), "genbank",output,"json")
	except Exception as e:
		print(str(e),file=sys.stderr)
		raise e

	SeqIO.write(seq, output, "json")
	jsonstring=output.getvalue()
	print("printing json string",file=sys.stderr)
	# note: the
	return HttpResponse(jsonstring[2:-2], content_type='application/json')
