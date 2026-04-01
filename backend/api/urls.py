from django.urls import path

from api.health import health_view


urlpatterns = [
    path("health/", health_view, name="health"),
]
