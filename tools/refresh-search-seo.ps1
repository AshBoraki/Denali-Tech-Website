param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sitemapPath = Join-Path $root 'sitemap.xml'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Get-SitemapPages {
    [xml]$sitemap = [System.IO.File]::ReadAllText($sitemapPath)
    $namespace = [System.Xml.XmlNamespaceManager]::new($sitemap.NameTable)
    $namespace.AddNamespace('s', 'http://www.sitemaps.org/schemas/sitemap/0.9')

    foreach ($node in $sitemap.SelectNodes('//s:loc', $namespace)) {
        $uri = [uri]$node.InnerText
        $relative = $uri.AbsolutePath.Trim('/')

        if (-not $relative) {
            $file = Join-Path $root 'index.html'
        }
        elseif ($relative.EndsWith('.html')) {
            $file = Join-Path $root ($relative -replace '/', '\')
        }
        else {
            $file = Join-Path $root (($relative -replace '/', '\') + '\index.html')
        }

        if (Test-Path -LiteralPath $file) {
            [pscustomobject]@{ Url = $node.InnerText; File = $file }
        }
    }
}

function Save-IfChanged([string]$path, [string]$before, [string]$after) {
    if ($before -eq $after) { return $false }
    if (-not $Check) {
        [System.IO.File]::WriteAllText($path, $after, $utf8NoBom)
    }
    return $true
}

$changed = [System.Collections.Generic.List[string]]::new()
$pages = @(Get-SitemapPages)

foreach ($page in $pages) {
    $before = [System.IO.File]::ReadAllText($page.File)
    $after = $before

    # Google has never used the meta keywords tag. Removing it avoids maintaining
    # keyword lists that add no search value and can make otherwise natural pages
    # read like they were written for a crawler.
    $after = [regex]::Replace(
        $after,
        '(?im)^[ \t]*<meta\s+name=["'']keywords["''][^>]*>[ \t]*\r?\n?',
        ''
    )

    # Keep the head readable after removing a tag from older hand-authored pages.
    $after = [regex]::Replace($after, '(?m)^<!-- Open Graph', '    <!-- Open Graph')
    $after = [regex]::Replace($after, '(?m)^<meta property="og:', '    <meta property="og:')

    # Repair adjacent duplicate organization URLs if this refresh was run with
    # an older, non-idempotent version of the script.
    $after = [regex]::Replace(
        $after,
        '(?:"url"\s*:\s*"https://denalitechs\.com/"\s*,\s*){2,}',
        '"url":"https://denalitechs.com/",'
    )

    # Explicitly allow the larger image, text, and video previews used by modern
    # Google results, including supporting links in AI search features.
    if ($after -notmatch '(?i)<meta\s+name=["'']robots["'']') {
        $after = [regex]::Replace(
            $after,
            '(<meta\s+name=["'']description["''][^>]*>)',
            '$1' + "`r`n    <meta name=`"robots`" content=`"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`">",
            1
        )
    }
    else {
        $after = [regex]::Replace(
            $after,
            '(<meta\s+name=["'']robots["'']\s+content=["''])[^"'']*(["''][^>]*>)',
            '${1}index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1$2',
            1
        )
    }

    # Connect article authorship and publishing information to the site's real
    # About page and organization entity when older posts omit those URLs.
    $after = [regex]::Replace(
        $after,
        '("author"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"Denali Tech Team")(?!\s*,\s*"url"\s*:)(\s*\})',
        '$1,"url":"https://denalitechs.com/about/"$2'
    )
    $after = [regex]::Replace(
        $after,
        '("publisher"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"Denali Tech")(?!\s*,\s*"url"\s*:)(\s*,)',
        '$1,"url":"https://denalitechs.com/"$2'
    )

    # Make the visible byline lead to the page that identifies the business and
    # its founder instead of leaving authorship as an unlinked label.
    $after = $after.Replace(
        '<span>By: Denali Tech Team</span>',
        '<span>By: <a href="/about/">Denali Tech Team</a></span>'
    )

    if (Save-IfChanged $page.File $before $after) {
        $changed.Add($page.File.Substring($root.Length + 1))
    }
}

$serviceAreas = [ordered]@{
    'arlington-heights-smart-home' = 'Arlington Heights'
    'chicago-smart-home-automation' = 'Chicago'
    'des-plaines-smart-home' = 'Des Plaines'
    'elk-grove-village-smart-home' = 'Elk Grove Village'
    'evanston-smart-home' = 'Evanston'
    'glenview-smart-home' = 'Glenview'
    'mt-prospect-home-automation' = 'Mt Prospect'
    'niles-smart-home' = 'Niles'
    'northbrook-smart-home' = 'Northbrook'
    'park-ridge-smart-home' = 'Park Ridge'
    'schaumburg-smart-home' = 'Schaumburg'
    'skokie-smart-home' = 'Skokie'
}

foreach ($entry in $serviceAreas.GetEnumerator()) {
    $file = Join-Path $root "services\$($entry.Key)\index.html"
    $before = [System.IO.File]::ReadAllText($file)
    $after = $before
    $url = "https://denalitechs.com/services/$($entry.Key)/"
    $descriptionMatch = [regex]::Match($after, '<meta\s+name="description"\s+content="([^"]+)"', 'IgnoreCase')
    $description = if ($descriptionMatch.Success) { $descriptionMatch.Groups[1].Value } else { "Smart home automation installation in $($entry.Value), Illinois." }

    $schema = @"
    <!-- Service-area Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "$($url)#service",
      "name": "Smart Home Automation in $($entry.Value), IL",
      "serviceType": "Smart Home Automation Installation",
      "description": "$description",
      "url": "$url",
      "areaServed": {
        "@type": "City",
        "name": "$($entry.Value)",
        "containedInPlace": {
          "@type": "State",
          "name": "Illinois"
        }
      },
      "provider": {
        "@type": "LocalBusiness",
        "@id": "https://denalitechs.com/",
        "name": "Denali Tech",
        "url": "https://denalitechs.com/",
        "telephone": "+1-312-439-7500",
        "email": "service@denalitechs.com"
      }
    }
    </script>
"@

    $after = [regex]::Replace(
        $after,
        '(?s)\s*<!-- LocalBusiness Schema -->\s*<script type="application/ld\+json">.*?</script>',
        "`r`n`r`n$schema",
        1
    )

    if (Save-IfChanged $file $before $after) {
        $relative = $file.Substring($root.Length + 1)
        if (-not $changed.Contains($relative)) { $changed.Add($relative) }
    }
}

if (-not $Check) {
    $sitemapBefore = [System.IO.File]::ReadAllText($sitemapPath)
    $sitemapAfter = $sitemapBefore
    foreach ($entry in $serviceAreas.GetEnumerator()) {
        $escapedUrl = [regex]::Escape("https://denalitechs.com/services/$($entry.Key)/")
        $sitemapAfter = [regex]::Replace(
            $sitemapAfter,
            "(<loc>$escapedUrl</loc>\s*<lastmod>)[^<]+",
            '${1}2026-07-11'
        )
    }
    if (Save-IfChanged $sitemapPath $sitemapBefore $sitemapAfter) {
        $changed.Add('sitemap.xml')
    }
}

if ($Check) {
    "Files that would change: $($changed.Count)"
}
else {
    "Updated files: $($changed.Count)"
}
$changed | Sort-Object
