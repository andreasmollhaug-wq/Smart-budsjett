import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isNeonomicsServerEnabled } from '@/lib/neonomics/feature'
import { createClient } from '@/lib/supabase/server'
import { markNeonomicsConsentOk } from '@/lib/neonomics/connectFlow'
import { getSiteUrl } from '@/lib/site-url'
import { resolveNeonomicsBankId } from '@/lib/neonomics/bankCatalog'

export const dynamic = 'force-dynamic'

function consentCompleteHtml(
  origin: string,
  profileId: string,
  bankId: string,
  redirectUrl: string,
): string {
  const payload = JSON.stringify({
    type: 'neonomics-consent-ok',
    profileId,
    bankId,
  })
  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Bankkobling</title>
</head>
<body>
<p>Bankkobling fullført. Sender deg tilbake …</p>
<script>
(function () {
  var payload = ${payload};
  var redirectUrl = ${JSON.stringify(redirectUrl)};
  var origin = ${JSON.stringify(origin)};
  var sent = false;
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, origin);
      sent = true;
      setTimeout(function () { window.close(); }, 400);
    }
  } catch (e) {}
  if (!sent) {
    window.location.replace(redirectUrl);
  }
})();
</script>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  if (!isNeonomicsServerEnabled()) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const url = new URL(req.url)
  const profileId = url.searchParams.get('profileId')?.trim()
  const bankIdParam = url.searchParams.get('bankId')?.trim()
  const base = getSiteUrl()
  const origin = new URL(base).origin

  if (!profileId) {
    return NextResponse.redirect(`${base}/konto/koble-til-bank?neonomics=error`)
  }

  let bankId: string
  try {
    bankId = resolveNeonomicsBankId(bankIdParam).bankId
  } catch {
    return NextResponse.redirect(`${base}/konto/koble-til-bank?neonomics=error`)
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.redirect(`${base}/konto/koble-til-bank?neonomics=error`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${base}/logg-inn`)
  }

  try {
    await markNeonomicsConsentOk(supabase, user.id, profileId, bankId, req)
  } catch {
    return NextResponse.redirect(
      `${base}/konto/koble-til-bank?neonomics=error&profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(bankId)}`,
    )
  }

  const redirectUrl = `${base}/konto/koble-til-bank?neonomics=connected&profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(bankId)}`
  const html = consentCompleteHtml(origin, profileId, bankId, redirectUrl)
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
