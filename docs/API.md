# Read API for CIC's org dashboard

`GET /api/v1/cohorts` returns completion and learning gain for every cohort, school
and the whole program, so CIC's own dashboard can pull them automatically.

It is read-only, protected by a shared key, and returns **aggregates only** (no
student names, picture codes or answers).

## Setup

1. Make a long random key: `openssl rand -hex 24`
2. Set it as `CIC_DASHBOARD_API_KEY` where the site runs (`web/.env.local` locally, the
   host's environment settings in production). Never commit it.
3. Give the same key to whoever runs CIC's dashboard.

If the key is missing or shorter than 24 characters the endpoint answers `503`
for everyone, so a misconfigured deploy can never leave it open.

## Request

```bash
curl -H "Authorization: Bearer $CIC_DASHBOARD_API_KEY" \
  "https://<your-site>/api/v1/cohorts"
```

Optional filters: `?school=Maryvale%20High%20School` and `?code=MVH3AI`.

| Status | Meaning |
|---|---|
| 200 | JSON below |
| 401 | Missing or wrong key |
| 405 | Anything other than GET |
| 503 | Key not configured on the server |

## Response

```jsonc
{
  "generated_at": "2026-11-15T12:00:00.000Z",
  "definitions": { "completion": "...", "learning_gain": "..." },
  "program": { "cohorts": 3, "students": 49, "completion": 0.61, "learning_gain": 0.38, "...": "..." },
  "schools": [ { "id": "…", "name": "Maryvale High School", "city": "Phoenix", "cohorts": 1, "completion": 0.7, "learning_gain": 0.4 } ],
  "cohorts": [
    {
      "code": "MVH3AI", "name": "Intro to AI — Period 3", "school": "Maryvale High School", "teacher": "Ms. Rivera",
      "students": 24, "students_started": 22,
      "completion": 0.7,            // share of assigned activities finished, 0..1
      "pretest_avg": 0.45,          // warm-up quiz average
      "posttest_avg": 0.85,         // wrap-up quiz average
      "learning_gain": 0.4,         // post minus pre, per student then averaged: 0.4 = +40 points
      "students_with_gain": 17,     // students who took both quizzes
      "students_needing_help": 3,
      "last_active_at": "2026-11-15T11:20:00.000Z"
    }
  ]
}
```

All rates are fractions from 0 to 1. A value is `null` when no student has the data
yet (for example, learning gain before anyone finishes a wrap-up quiz).
