"""Run on the existing Coolify host. Copies only existing admin login values, never prints secrets."""
import json, os, pathlib, secrets, subprocess

root = pathlib.Path('/opt/onetimesuite-website-studio')
root.mkdir(parents=True, exist_ok=True)
envfile = root / '.env'
if envfile.exists():
    print('Existing environment preserved')
else:
    containers = json.loads(subprocess.check_output(['docker', 'inspect', *subprocess.check_output(['docker', 'ps', '-q'], text=True).split()]))
    candidates = [c for c in containers if any('Host(`onetimesuite.com`)' in v and 'PathPrefix(`/`)' in v for k,v in (c['Config'].get('Labels') or {}).items() if k.endswith('.rule'))]
    if len(candidates) != 1:
        raise SystemExit('Expected exactly one existing main-site container')
    source = dict(v.split('=', 1) for v in candidates[0]['Config']['Env'])
    values = {'PUBLIC_URL':'https://onetimesuite.com', 'HOST':'0.0.0.0', 'PORT':'3180', 'DATA_DIR':'/data', 'WEBHOOK_SECRET':secrets.token_urlsafe(48), 'SESSION_SECRET':secrets.token_urlsafe(48), 'KIMI_MODEL':'kimi-k3', 'KIMI_BASE_URL':'https://api.moonshot.ai/v1', 'MAX_BUILDS_PER_DAY':'20', 'MAX_PENDING_JOBS':'100', 'TRUST_PROXY':'true'}
    for key in ['ADMIN_USER_1','ADMIN_PASS_1','ADMIN_USER_2','ADMIN_PASS_2']:
        if source.get(key): values[key] = source[key]
    if not values.get('ADMIN_USER_1') or not values.get('ADMIN_PASS_1'):
        raise SystemExit('Existing admin login is not configured')
    if any('\n' in v or '\r' in v for v in values.values()):
        raise SystemExit('Environment values contain unsupported line breaks')
    # Compose raw env-file values are single quoted so dollar signs are not interpolated.
    envfile.write_text('\n'.join(k+"='"+v.replace("'", "\\'")+"'" for k,v in values.items())+'\n')
    os.chmod(envfile, 0o600)
    print('Private environment created; existing One Time Suite admin logins retained')
