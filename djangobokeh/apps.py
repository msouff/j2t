import os

from django.apps import AppConfig

from bokeh.command.util import build_single_handler_application
from bokeh.server.contexts import ApplicationContext

from .routing import RoutingConfiguration


class DjangoBokehConfig(AppConfig):

    name = 'djangobokeh'

    def ready(self):

        # print("DjangoBokehConfig.ready()")
        # os.environ['BOKEH_NODEJS_PATH'] = settings.BOKEH_NODEJS_PATH

        path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "bokeh_apps/sliders.py")
        application = build_single_handler_application(path)
        route = application.handlers[0].url_path()
        self._applications = dict()
        self._applications[route] = ApplicationContext(application, url=route)
        self.routing_config = RoutingConfiguration(self._applications)
