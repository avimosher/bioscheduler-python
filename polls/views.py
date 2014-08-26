from django.shortcuts import render, render_to_response
from django.http import HttpResponse
from django.template.loader import render_to_string
import json
import sys
import StringIO
from Bio import SeqIO
import SeqToJSON

# Create your views here.

def index(request):
    return HttpResponse("Hello, world.  You're at the poll index.")

def detail(request, poll_id):
    return HttpResponse("You're looking at poll %s."%poll_id)

def results(request, poll_id):
    return HttpResponse("You're looking at the results of poll %s."%poll_id)

def vote(request,poll_id):
    return HttpResponse("You're voting on poll %s." % poll_id)

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

def kineticjstest(request):
	return render(request, 'kineticjstest.html')

def getsequence(request):
	print "output\n"
	s=render_to_string('test.gb')
	print "s failed\n"
	seq=SeqIO.read(StringIO.StringIO(s), "genbank")
	output=StringIO.StringIO()
	SeqIO.write(seq, output, "json")
	print output.getvalue()
	seqdict={}
	seqdict['seq']=str(seq.seq)
	try:
		print json.dumps(seqdict)
	except:
		e=sys.exc_info()[0]
		print e
	jsonstring=output.getvalue()
	print jsonstring[2:-2]
	return HttpResponse(jsonstring[2:-2], content_type='application/json')