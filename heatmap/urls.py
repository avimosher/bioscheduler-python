from django.conf.urls import patterns, url

from heatmap import views

urlpatterns = patterns('',
                       url(r'^$', views.index, name="index"),
                       url(r'^heatmap.html$', views.heatmap, name='heatmap'),
)
