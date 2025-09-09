from django.urls import path, include

from .views import FeatureSelectionAPIView

urlpatterns = [
    path('pfs/', FeatureSelectionAPIView.as_view(), name='progressive_feature_selection'),
]