from django.conf.urls import url

from . import views


# sync http
urlpatterns = [
    url(r'^$', views.HomeView.as_view(), name='home'),
]