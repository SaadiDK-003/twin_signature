# Twin Signature

Shopify Skeleton storefront adapted to the Arome reference at https://arrax-preview.myshopify.com/, with Twin Signature branding. This is a client transfer store for Pakistan. Twin Signature was published as its live theme on 2026-11-18.

- Project: `/var/www/html/Shopify_Projects/twin-signature`
- Admin: https://admin.shopify.com/store/twin-signature-4u8gmwse
- Storefront: https://twin-signature-4u8gmwse.myshopify.com
- Editor: https://admin.shopify.com/store/twin-signature-4u8gmwse/themes/163227304038/editor
- Live theme: Twin Signature, ID `163227304038`
- Previous theme: Horizon, ID `163227205734`, retained unpublished
- Development theme: `163227369574`
- Local preview: http://127.0.0.1:9292/
- Original base: Shopify/skeleton-theme release v1.0.0

## Development and sync

```bash
cd /var/www/html/Shopify_Projects/twin-signature
shopify auth login --alias saad@devteampro.us
shopify theme dev --environment development
```

The development command syncs local changes to a development theme. The store remains password protected; its password is available in Shopify Admin → Online Store → Preferences. No credentials are stored in this repository.

Continue editing locally with the development command above. The former `preview` CLI environment is now named `production`, because theme `163227304038` is live.

For an intended release to the live storefront:

```bash
shopify theme push --environment production --allow-live --strict
```

The previous Horizon theme is retained for rollback. Publishing a theme does not remove the store password or transfer ownership. Ownership can later be transferred through Shopify's Dev Dashboard.

## Storefront and editing

The homepage includes three slides with separate mobile images, category banners, product tabs, a fragrance film, product carousel, brand logos, promotion, shoppable lookbook, sample testimonials, and journal articles. Sections, text, images, product choices, collections, and relevant links are editable in the theme editor. Product lists preserve the reference's featured product order; clear a product list to use its selected collection instead.

Header navigation has a complete default mega menu. A Shopify menu can replace it using the header's Navigation menu setting. Footer Information links use the native `Twin Signature Information` menu under Content → Menus. The remaining footer links use Shopify routes and the store's pages.

Product pages support native variants, pricing and availability, images and zoom, quantity, Ajax cart, quick view, and browser-local wishlist. Search uses Shopify predictive search and native search results. Collections support native filters, sorting, pagination, and responsive grid controls. Newsletter and contact forms use native Shopify forms.

About, FAQ, Contact and Wishlist have custom section layouts. `templates/page.liquid` dispatches the default page template by handle so these work while the theme is unpublished. Other pages render the native page body. Custom JSON page templates are also available for future assignment. The FAQ and About default static section blocks are in `config/settings_data.json`.

## Demo resources already imported

- 13 products, 134 variants, 118 product images
- 7 automated collections: women-perfumes, men-colognes, gift-sets, best-sellers, popular-perfumes, new-arrivals, sale
- Pages: about-us, faq, contact-us, wishlist, privacy-policy, shipping-returns, terms-conditions
- 3 articles in the `news` blog with native featured images
- Product metafields: custom.notes, custom.gender, custom.longevity, custom.demo_rating, custom.demo_rating_count
- Search & Discovery installed and configured with Availability, Price, Notes, Gender, Longevity, Color, Weight, Category (product type), and Brand filters

Sample prices are reference dollar numbers multiplied by 100 and expressed in PKR; they are demonstration prices, not currency conversions. Descriptions, sample ratings, testimonials, and policies are demo content for the client to replace or review before launch. Two products are deliberately sold out to match the sample storefront.

`demo/products.csv`, `demo/metafields.csv`, and `demo/catalog.json` preserve the imported catalog. `demo/asset-sources.json` records reference asset URLs. `scripts/build-demo-import.py` regenerates the CSV files from the catalog. `scripts/prepare-demo.py` is the initial reference extraction tool and resets the catalog to its initial homepage subset; do not rerun it against the completed catalog without a backup. Reimporting data is unnecessary for normal theme edits.

## Validation

```bash
node --check assets/signature.js
shopify theme check
```

Browser checks cover homepage rendering, native variant changes and prices, quick-view identifiers, cart add/quantity/subtotal/remove, wishlist persistence, collection filtering and price sorting, predictive and full search, custom page routes, and responsive layouts. Contact/newsletter submissions and checkout payment are intentionally not sent during QA.

Theme Check passes with no errors. Two inherited/advisory warnings remain: the unused Skeleton `image` snippet and the font preload recommendation.

A theme-only handover ZIP is saved as `Twin Signature-0.1.0.zip`. Desktop proof of the finished storefront is in `demo/previews/home-desktop.jpg`. The hosted preview homepage and About layout were verified after the final upload. Responsive checks used 390px mobile and 768px tablet viewports; both render without page overflow after the toolbar and hero fixes.

## Variant picker correction

The product picker uses circular bottle-image swatches, a dark selection ring, hover labels, filled dark size buttons, and matching stock typography. The Products with plain color swatches setting preserves the reference’s plain-color exceptions. Image changes use gallery URLs, update the active thumbnail, and show a loading state. Hover/focus warms the full-size image. Product and quick-view controls share the same picker.

`demo/variant-media.json` records the reference swatch sources. `demo/variant-images-update.csv` was imported to correct 118 native variant photo assignments across 11 products. The other two products retain their existing photos. `demo/variant-verification.json` records the post-import audit; all 134 variant IDs, options, prices, and availability were preserved. Shopify may regenerate media filename suffixes during import. `scripts/build-variant-image-update.py` uses the pre-import audit to generate that one-time update; take a fresh audit before using it after catalog edits.

The updated picker was checked at 390px with Red / 200ML selected (PKR 11,850), without page overflow. Quick view → Red / 500ML → cart showed PKR 15,800 and the correct variant. The test cart item was removed. Updated screenshots are in `demo/previews/product-variants-desktop.jpg` and `product-variants-mobile.jpg`.

## Homepage and header refinement — 18 November 2026

Compared the full reference homepage on desktop and mobile. Category labels now sit below their images; product cards use plum ratings and prices; the video has a cream background and an offset poster; the brand strip is green; the promotion is white with an editable demo countdown; the lookbook shows two products on the left and its image on the right; testimonials use white cards; journal images use the reference’s wide proportions; and the footer uses the plum background. Twin Signature branding, PKR pricing, native links, and demonstration review content remain in place. The demo promotion countdown is configured for 3 July 2027 and should be reviewed before launch.

Header search focuses through its rounded form border. Desktop and mobile predictive search support keyboard navigation, Escape dismissal, and stale-request cancellation. Mobile has a dedicated search button and dialog. Its hero uses an image above a separate text panel, matching the reference’s mobile composition.

The cart drawer animates in over 420ms and out over 300ms, honors reduced motion, keeps page width stable, returns focus, and places the subtotal and actions at the bottom with independently scrolling cart lines. At 390px it fills the viewport. A quick-view test item was added, increased to two (Rs.15,800), and removed. No order or form submission was made.

Responsive checks passed at 390px, 768px, 1024px, and desktop width without horizontal page overflow. Theme Check reports zero errors and the same two advisory warnings. Screenshots: `demo/previews/home-desktop-refined.jpg`, `home-full-refined.jpg`, `home-mobile-refined.jpg`, and `cart-mobile.jpg`.

## Detailed homepage section pass — 18 November 2026

`assets/homepage.css` now holds measured homepage section typography and spacing. Product cards use the reference’s three round option/quick-view/wishlist controls and tooltips, without the extra bottom selection bar. The Men and Kid’s tabs use the exact reference product order. Product card text spacing, video caption, brand strip height/color, promotion image width, testimonial cards, and journal metadata were measured against the reference. `demo/reference-homepage-audit.json` records the source section measurements and tab products.

Lookbook hotspots now use the source coordinates (48%/41%, 18%/78%, 74%/59%) with matching product preview cards. The carousel advances one product at a time and wraps at either end. The lookbook keeps two products visible on tablet, and testimonials show two cards on tablet with horizontal scrolling, reducing to one card on mobile.

The footer includes five working share/profile controls, payment icons, and native country/language forms. When no payment providers are configured, the editor’s **Show sample payment icons until payment methods are configured** setting supplies sample badges; these do not configure payments. Set real Instagram/Facebook profile URLs in the footer settings; otherwise the controls share/copy the store URL. Brand text, native prices/availability, article metadata, and demonstration reviews remain Twin Signature content.

The newsletter panel uses the reference’s actual portrait artwork, bottom-left placement, inline desktop signup form, mobile stacked form, and dismissal button. It opens without blocking page scrolling and does not interrupt active typing. Its heading remains a generic signup message; no unconfigured discount is advertised. No newsletter, contact, localization, or checkout submission was made during this pass.

## Footer and player alignment correction

Contact-page styles now use `.ts-contact-form`; newsletter forms have their own `.newsletter-form` class. This removes the two-column contact grid that was overriding the footer email field. The arrow has a fixed 48px slot with its icon centered. Overlay close controls have fixed 44px square bounds and SVG icons. The video now plays inside the poster, matching the reference, with a close control that removes the iframe and restores the poster. The inline player’s bounds and centered close icon were verified in the browser. Final footer visual verification was interrupted when browser access became unavailable; JavaScript syntax and Theme Check passed.

The local preview was restarted independently of the chat using `setsid`. Its PID is in `.local/preview.pid`, and its log is `/tmp/twin-signature-theme-dev.log`. The storefront returned HTTP 200 after restart. Stop only this preview with `kill "$(cat .local/preview.pid)"` from the project directory when needed.

Product gallery thumbnails now use the reference slider proportions: square images, 15px corners, 10px gaps, a dark selected border, and five/four/three visible thumbnails on desktop/tablet/mobile. Previous/next controls move three thumbnails, disable at either end, and respond to scrolling and resize. Variant selection continues to update the main image and reveal its selected thumbnail. The reference gallery markup and stylesheet were inspected for these values; final browser visual verification is unavailable in this session.

## Client logo trial

Enabled `client_branding` under Theme settings → Twin Signature. This adds a compact, transparent gold header wordmark, the client's unchanged original artwork in the footer, a black footer and announcement bar, and bronze accents. Toggle it off to restore the previous presentation. Header and footer image pickers can replace these assets. Header logo display dimensions are 185×66px desktop and 129×46px mobile; responsive CDN variants avoid serving the large source in the header. The original JPG is preserved as `assets/twin-signature-client-original.jpg`; the header adaptation is `assets/twin-signature-header-gold.png`. The compact header version was prepared with the built-in image generation tool, preserving the wording and removing the lower artwork and large detached flourish. Browser visual verification remains unavailable; rendered markup and image delivery were checked.

## Inventory-driven stock display

The stock message reads Shopify's tracked inventory for the selected variant; demo imports initially set available variants to 15 units. Change actual quantities in Shopify Admin → Products → Inventory. Product information settings now include Show exact quantity when stock is low and Low stock threshold (default 20). Both server-rendered and variant-change stock bars calculate quantity / threshold, capped at 100%; the bar is decorative and does not represent a historical starting inventory. Untracked stock does not display a count or bar, and available backorders display Available to order. Invalid option combinations clear the previous stock message. Latest Shopify inventory is loaded on each product-page request or quick-view fetch; changes elsewhere are reflected when the page/quick view is reloaded. Store inventory was not modified during verification.

## Quick view

Quick view now uses a fixed header and close control, with one inner scroll region and a thin neutral scrollbar. The desktop layout has two constrained columns with a sticky square image; mobile stacks a compact image above the product form. Full-page breadcrumbs, accordions, thumbnail navigation, and social links are removed from the imported product markup. The product form, accelerated payment button, variant options, stock JSON, and price handling are preserved. View full details carries the selected variant. Fetches are aborted when replaced or closed, and late responses cannot repopulate a closed popup. Loading/error states remain inside the same shell. JavaScript checks cover the transformation against rendered Shopify HTML, ID/label preservation, and request lifecycle behavior. Browser visual verification remains unavailable.

## Client editing and empty content

`CLIENT_GUIDE.md` describes client controls in the native theme editor. Optional headings, paragraphs, buttons and wrappers are omitted when blank. Empty collection tabs, logos, testimonials and product hotspots are skipped; single-slide and single-tab sections do not render unnecessary controls. Native product/collection/blog/page pickers replace legacy string handles, with current template selections migrated. Existing live product-template content was preserved before migration. Product support accordions now read native information pages. Footer columns, FAQ help content, popup copy/image and branding colors have native settings.

The hero play/pause uses centered SVG icons in a 32px circle; its vertical center matches the slide dots on desktop and mobile. Rotation interval and navigation visibility are configurable. The pause control is omitted when rotation is off or only one valid slide exists. Hero, tabs and lookbook respond to block selection in the Shopify editor.

Verified actual Shopify rendering with a temporary alternate page template, now preserved as `demo/editor-empty-fields-fixture.json` rather than installed on the storefront. Desktop and 390px mobile checks found zero empty headings/paragraphs or horizontal overflow; fully blank hero/promotion/footer content collapsed to zero height, a disabled section did not render, and single-item controls disappeared. New controls and populated homepage were visually checked. Proof: `demo/previews/hero-managed-mobile.jpg`.

## Theme editor header CSS isolation

The unused `hello-world` section had an unscoped `.icon { width: 300px }` stylesheet rule. Shopify's editor loaded that compiled section CSS after the theme assets, expanding header SVGs and their anchor boxes to 314px including padding. The search input collapsed as a result. Scoped the starter rule to `.welcome-content > .icon` and added explicit desktop header action icon dimensions. Desktop/mobile editor previews were visually verified. Temporary diagnostics were removed. Screenshot: `demo/previews/header-editor-fixed.jpg`.

A Shopify CLI Liquid profile of the homepage measured 175.34ms of Liquid execution in one sample. This does not measure total page load, browser rendering, network transfer, or Shopify Admin startup; it does not pinpoint the remaining editor loading delay. Summary: `demo/header-editor-diagnosis.json`.

## Native Cart theme settings

Added a Cart group with drawer/page behavior, native vendor display, persisted cart notes, editable empty-state copy/collection and drawer background/text colors. Drawer remains the default; no production settings data was overwritten for this release. Header links respect page mode, and AJAX add-to-cart navigates to the cart page when selected. Notes save via the existing serial cart queue, synchronize the drawer/page fields and remain native form inputs for checkout. Drawer/page note IDs are distinct. Empty optional copy is omitted.

Browser checks covered the empty collection tile/link, vendor display, desktop and mobile drawer layouts, note saving and retention through quantity changes/navigation, header page navigation and product add-to-cart redirection. Test note/items were removed and local settings restored. No checkout was submitted. The local development server's failed upstream session was restarted. Theme Check: zero errors and two inherited warnings.

## Footer giveaway

The `giveaway` block inside Footer owns all popup settings and renders `snippets/ts-giveaway-popup.liquid`. Dedicated CSS and an isolated custom element provide the branded modal, responsive image layout, native dialog focus/Escape handling, outside-click dismissal, optional reopen tab, display delay/frequency, mobile/homepage visibility and optional real closing-time countdown. Empty copy is omitted; image-free layouts collapse to one column and completely empty content renders no popup. All timers/listeners are released on editor section replacement. The native block selection and preview checkbox can inspect a disabled giveaway. Editor submission is intercepted without creating a signup.

Shopify's native customer form handles email marketing signup/spam protection. Required unchecked consent is explicit; clearing consent or button copy removes the form. Tags include newsletter, giveaway and the normalized campaign ID. Server form success/errors only open this popup when the matching campaign has a pending submission in this browser session, avoiding unrelated footer/newsletter form responses. Display history is scoped by campaign in local storage; unavailable storage falls back to memory. An active giveaway suppresses the legacy newsletter popup. The date cutoff controls storefront display/submission UI, not server-side contest eligibility. Winner selection, entry eligibility/deduplication and fulfillment need a separate operational process.

Initial live settings retain placeholder copy and leave the campaign disabled, as requested. Preserved the current live footer settings before adding the single block. Native form structure and browser validation, Escape/close/reopen, persisted dismissal, desktop/390px mobile and 375×667 constrained-height layouts were checked. No horizontal popup overflow; small screens use one vertical scroll region. Actual Shopify Liquid rendering was checked with cleared headings/description/prize/image and with all content cleared. Five Node tests exercise campaign history, signup suppression, new campaigns, blocked automatic opens, mobile/disabled behavior, deadlines and editor access: `node tests/giveaway.test.cjs`. Theme Check: zero errors, two inherited warnings. No customer signup was submitted against the placeholder campaign. Proof: `demo/previews/giveaway-editor.jpg` and `demo/previews/giveaway-mobile.jpg`.

## Shopify Forms integration and success controls

The theme email form now hides the decline control after a successful signup and exposes an editable Continue shopping success button. A shared `showSuccess()` path controls fields, intro, decline, success and accessibility labels; regression coverage brings the giveaway tests to six. Editor previews use a nonmodal dialog so the popup cannot block the Shopify editor sidebar. Storefront dialogs remain modal.

Footer supports native app blocks. Shopify Forms app block `forms_inline_bNbyex` uses inline form `1264427` (`Twin Signature Giveaway`). The Footer giveaway's signup-source setting places this app block inside the popup, replacing the theme-owned form/intro/decline entirely; the app owns fields, consent, fonts, tags and success. Form colors match the popup. Shopify's Forms app embed is enabled, and its block configuration was merged into local settings for preview. The section's optional Useful links menu picker moved into its own block because app-compatible sections allow only one link-list section setting. Existing links/settings were preserved.

The native form includes email and optional marketing consent, giveaway/campaign tags, Playfair headings and Inter body text. Welcome workflows and submission email notifications remain off. Automatic review initially rejected activation while placeholder content remained; the user explicitly approved activating and connecting Form 1264427, after which activation was confirmed using the Turn form off control. Existing giveaway enablement was preserved. No test signup was submitted.

Shopify Forms' rich-text editor needs real keyboard input. Direct replacement/type methods can leave its model and visible text out of sync. A fresh form tab and short keyboard-input chunks resolved the descriptions; the valid configuration was saved with no pending changes. The built-in success preview shows You're on the list / Thanks for entering the giveaway.

Final verification: the live theme uses `giveaway_form_source: shopify_forms`, native Forms block ID 1264427, and an enabled Forms app embed. The rendered theme-editor popup shows the app's email field, unchecked optional marketing checkbox and entry button inside the branded shell, with no decline control. Desktop/mobile previews fit the popup; native editor controls remain usable while preview is open. Provider-specific theme copy controls are hidden in Shopify Forms mode. Preview artifacts: `demo/previews/giveaway-shopify-forms-mobile.jpg`, `demo/previews/shopify-forms-confirmation.jpg`.

## Giveaway field clipping and scrollbar

Shopify Forms uses outer field/focus shadows inside overflow-clipped inline containers. Zero app padding clipped the email field's right border. Added native Forms-block padding (6px horizontal, 4px vertical), preserving the live footer configuration. The popup removes the root stable scrollbar gutter while open and compensates body padding to retain page alignment. The scrollbar measurement is held through popup-time resizes. The image's minimum height now responds to viewport height, so the desktop popup fits short windows. On constrained screens it remains vertically scrollable with its scrollbar track hidden; horizontal overflow is suppressed.

Verified actual Shopify Forms shadow-DOM field bounds and focused-border clearance. Desktop, 1280×480 and 390×844 popup dimensions showed no overflow. The mobile popup measured 364×484 with equal scroll/client dimensions; compact desktop measured 848×427 with equal scroll/client dimensions. No signup was submitted. The local preview's failed upstream connection was restarted. Theme Check: zero errors and two existing warnings.
