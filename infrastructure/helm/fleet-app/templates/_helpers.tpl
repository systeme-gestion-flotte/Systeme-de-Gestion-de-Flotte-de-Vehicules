{{/* Return the name of the app */}}
{{- define "fleet-app.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels */}}
{{- define "fleet-app.labels" -}}
app: {{ include "fleet-app.fullname" . }}
{{- end }}
