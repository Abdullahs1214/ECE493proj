from unittest.mock import patch

from django.test import Client, TestCase


class GameplayFlowTests(TestCase):
    @patch("engine.scoring_engine.random.randint", side_effect=[80, 90, 100])
    def test_single_player_gameplay_flow(self, _mock_randint) -> None:
        client = Client()
        guest_response = client.post(
            "/sessions/guest/",
            data='{"displayName":"Player One"}',
            content_type="application/json",
        )
        self.assertEqual(guest_response.status_code, 201)

        start_response = client.post(
            "/gameplay/start/",
            data='{"mode":"single_player"}',
            content_type="application/json",
        )
        self.assertEqual(start_response.status_code, 201)
        match_id = start_response.json()["gameplay"]["matchId"]

        submit_response = client.post(
            "/gameplay/submit/",
            data='{"matchId":"%s","blendedColor":[80,90,100]}' % match_id,
            content_type="application/json",
        )
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.json()["gameplay"]["matchStatus"], "results")

        state_response = client.get(f"/gameplay/state/?matchId={match_id}")
        self.assertEqual(state_response.status_code, 200)
        self.assertEqual(state_response.json()["gameplay"]["results"][0]["rank"], 1)
