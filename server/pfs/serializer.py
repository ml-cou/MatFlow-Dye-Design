from rest_framework import serializers


class FeatureSelectionSerializer(serializers.Serializer):
    dataset = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    target_var = serializers.CharField(required=True)
    problem_type = serializers.ChoiceField(choices=['regression', 'classification'])
    estimator_name = serializers.ChoiceField(choices=[
        'ExtraTreesRegressor', 'RandomForestRegressor', 'GradientBoostingRegressor', 'XGBRegressor',
        'ExtraTreesClassifier', 'RandomForestClassifier', 'GradientBoostingClassifier', 'XGBClassifier',
    ])
    kfold = serializers.IntegerField(default=2)
    display_opt = serializers.ChoiceField(choices=['All', 'Custom', 'None'], default='None')
    features_to_display = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True, allow_empty=True
    )
