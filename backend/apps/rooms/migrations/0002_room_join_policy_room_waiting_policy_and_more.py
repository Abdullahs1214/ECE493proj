import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="join_policy",
            field=models.CharField(
                choices=[
                    ("open", "Open"),
                    ("locked_for_active_match", "Locked for active match"),
                ],
                default="open",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="room",
            name="waiting_policy",
            field=models.CharField(
                choices=[
                    ("late_join_waiting_allowed", "Late join waiting allowed"),
                ],
                default="late_join_waiting_allowed",
                max_length=64,
            ),
        ),
        migrations.AlterField(
            model_name="room",
            name="room_status",
            field=models.CharField(
                choices=[
                    ("open", "Open"),
                    ("active_match", "Active match"),
                    ("closed", "Closed"),
                ],
                default="open",
                max_length=32,
            ),
        ),
    ]
