from django.conf.urls import patterns, url

from polls import views

urlpatterns = patterns('',
                       url(r'^$', views.index, name="index"),
                       url(r'^(?P<poll_id>\d+)/$', views.detail, name='detail'),
                       url(r'^(?P<poll_id>\d+)/results/$', views.results, name='results'),
                       url(r'^(?P<poll_id>\d+)/vote/$', views.vote, name='vote'),
                       url(r'^testjsp.jsp$', views.testjsp, name='testjsp'),
                       url(r'^create$', views.ajaxresponse, name='ajaxresponse'),
                       url(r'^simpletest.html$', views.simpletest, name='simpletest'),
                       url(r'^getsequence$', views.getsequence, name='getsquence'),
)

