# Managing Twin Signature in Shopify

Open **Shopify Admin → Online Store → Themes → Edit theme** (or **Customize**, depending on the admin label). Select the homepage or the page/product template you want to edit.

## Giveaway popup

The giveaway now uses **Shopify Forms**, form **Twin Signature Giveaway (1264427)**. Open **Apps → Forms → Twin Signature Giveaway** to edit fields, title/description, success message, fonts, consent and submission tags, or view submissions. Marketing opt-in is a separate checkbox. The Forms app embed is enabled. The form was activated and connected with your explicit approval while the campaign still has placeholder prize copy.

In **Footer → Giveaway popup**, keep **Signup form → Shopify Forms app**. Its image/caption, campaign display history, delay, mobile/homepage visibility and closing time stay in the theme. The sibling **Forms** block in Footer holds Form ID `1264427` and its colors/alignment. Theme form copy and success text appear only when you switch back to **Theme email form**; irrelevant controls are hidden in Shopify Forms mode. The app handles its own entry/confirmation display; the theme does not read private widget state or duplicate its success message. The custom popup has no decline link in Shopify Forms mode, including after submission.

To pause the whole giveaway, disable **Enable giveaway** in Footer; this leaves the form and saved submissions available in the Forms app. Changing the campaign ID in Footer resets popup display history; update the Forms app tags separately for a new campaign.

Open **Edit theme → Footer → Giveaway popup**. This is a single block inside the Footer section; its layout is rendered by a reusable snippet. If you remove it, use **Footer → Add block → Giveaway popup** to restore it.

The initial campaign uses sample copy. It was subsequently enabled and connected to Shopify Forms with explicit approval. Turn on **Preview giveaway in editor** to review it without launching it. Selecting the block also opens its preview. Preview submissions do not send signups.

- Edit the heading, description, prize highlight, image/caption, button, dismiss text and success copy. Clear optional fields to hide them. Turn off the image for a compact form layout. Clearing the button or consent text hides the signup form.
- Add your giveaway rules URL and link label. Set an optional closing time such as `2026-12-31T23:59:00+05:00`, replacing the date; the countdown uses that exact time. After that time the shopper popup and reopen tab stop showing. The theme display does not enforce contest eligibility on the server.
- Choose the delay, homepage-only/mobile visibility, dismissal interval and small reopen tab. With the theme email form, a successful signup suppresses automatic display for that campaign on that browser. Shopify Forms manages its own submission state. Browser storage is used for display history; clearing browser data resets it.
- Set a **new Campaign ID for each giveaway**. It creates a separate campaign tag and resets display history. Use **Enable giveaway** when the real prize, dates and rules are ready.
- When using **Theme email form**, its native Shopify customer form subscribes the address to email marketing, so the consent checkbox starts unchecked and is required. Signups include `newsletter`, `giveaway`, and `giveaway-CAMPAIGN-ID` customer tags. Review participants in **Customers** using the campaign tag. Winner selection, deduplication, eligibility checks and prize fulfillment are managed separately; the popup does not draw a winner or send a prize automatically.

The existing newsletter popup pauses on pages/devices where the giveaway is active, so visitors do not receive two competing offers.


## Sections and content

- Use **Add section**, drag sections to reorder them, or use the eye icon to hide/show a section. Hiding keeps its saved settings.
- Edit headings, introductory text, paragraphs, images and button labels inside each section. Clear optional text to remove that element and its extra spacing. Clear a button label to remove the button.
- Remove an empty block or leave its required content blank: empty testimonials, product hotspots, logos and tabs are omitted from the storefront. Setup hints are shown only inside the theme editor.
- Section background and outer padding remain part of the design; empty elements and unused grid columns do not reserve space. Fully empty content sections collapse.

## Homepage

| Section | Client controls |
| --- | --- |
| Signature slideshow | Slides and order, desktop/mobile images, headings, eyebrow, button text/link, automatic rotation, interval, arrows and dots. A single slide has no carousel controls. Turning off rotation removes the play/pause button. |
| Collection banners | Images, titles, native collections/links and product-count visibility. |
| Best seller tabs | Tab labels, native collections, selected products and product limit. An empty tab is omitted; one valid tab has no unnecessary tab bar. |
| Signature video | Heading, eyebrow, poster and video URL. Clear the video URL to remove its play control. |
| Perfume carousel | Heading, subtitle, native collection, optional selected products, product limit and View all label. |
| Brand logos | Add/remove/reorder logo blocks and upload images. |
| Promotion | Heading, eyebrow, paragraph, image, countdown date and button label/link. Clear the date to remove the countdown. |
| Lookbook | Image, heading/subtitle, native product pickers and hotspot positions. Cleared products leave no empty cards or hotspots. |
| Testimonials | Quotes, names, captions and 0–5 stars. Zero hides stars. Quotes are manually curated content. |
| Blog | Native blog selection, heading, eyebrow, article count, author/date visibility and View all label. Manage articles in Shopify's blog administration. |

Some image sections include a **Use included starter image** switch. Turn this off and clear the uploaded image to remove that image area. Slides, collection banners, video posters and logo blocks also retain the existing starter asset fields; clearing these removes the included starter image.

## Header, footer and newsletter

The header controls the logo, menu, announcement visibility/text and store link. Footer settings control the logo, brand description, social links, menu headings and menus, newsletter, button label, payment icons and copyright text. Footer columns reflow when hidden.

Under **Theme settings → Twin Signature**, manage the accent color, branding palette, newsletter popup heading/body/button/consent/decline text and popup image. The footer's payment icons are samples until real payment methods are configured.

## Products and information pages

Manage product titles, descriptions, prices, media, variants and inventory under **Products**. In the product template's **Product information** section, manage stock visibility/threshold and the description, shipping and privacy accordion headings. Choose the shipping/privacy pages there and update their content in Shopify's page editor. Clearing a heading or chosen page hides its corresponding accordion.

FAQ and About sections have editable headings, copy, blocks and buttons. The FAQ help card can be edited or hidden. The contact section has editable business information and submit/FAQ link labels.

## Preview and releases

Check both desktop and mobile previews, then save. Changes made to the live theme appear on the storefront after saving; use the development theme for draft work. Product inventory is refreshed on product-page load or quick-view fetch.

Shopify documents the native [section editing model](https://shopify.dev/docs/storefronts/themes/architecture/sections) and [JSON template controls](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates).

## Cart settings

Open **Theme settings → Cart**. Choose **Drawer** to open the side cart after adding a product, or **Page** to go to the full cart page. The header cart link follows the same choice. Drawer is the default.

- **Show product vendor** displays the native Shopify product vendor on cart lines.
- **Enable cart note** adds order instructions to both the cart page and drawer. Notes save to the Shopify cart and are included in the checkout form.
- **Empty cart** controls the heading, text and button label. Clear optional copy to hide it. Select a collection to show its image/title in the empty drawer and use its URL for the continue-shopping button. Clear the collection to remove the tile and return the button to all products.
- **Drawer colors** control its background and text. Buttons follow the theme accent.

Cart settings apply throughout the store; they are separate from the Shopping cart page section.

The optional **Useful links menu** picker is now a Footer block (Footer → Add block → Useful links menu). The Information menu remains in Footer settings. This keeps Footer compatible with Shopify app blocks.
