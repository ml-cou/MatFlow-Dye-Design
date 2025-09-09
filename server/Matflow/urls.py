
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('pso.urls')),
    path('api/', include('pfs.urls')),
    path('api/', include('matflow_test.urls')),
    path('api/', include('eda.urls')),
    path('api/', include('dataset_manager.urls')),
    path("api/", include("molecules.urls")),
]
