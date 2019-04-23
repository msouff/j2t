from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

from django.apps import apps

djangobokeh_app_config = apps.get_app_config('djangobokeh')


application = ProtocolTypeRouter({
    # (http->django views is added by default)
    'websocket': AuthMiddlewareStack(
        URLRouter(
            djangobokeh_app_config.routing_config.get_websocket_urlpatterns()
        )
    ),
    'http': AuthMiddlewareStack(
        URLRouter(
            djangobokeh_app_config.routing_config.get_http_urlpatterns()
        )
    ),
})