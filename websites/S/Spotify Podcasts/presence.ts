const presence = new Presence({
		clientId: "619561001234464789",
	}),
	browsingStamp = Math.floor(Date.now() / 1000),
	shortenedURLs: Record<string, string> = {};

let search: HTMLInputElement,
	recentlyCleared = 0;

async function getShortURL(url: string) {
	if (!url || url.length < 256) return url;
	if (shortenedURLs[url]) return shortenedURLs[url];
	try {
		const pdURL = await (
			await fetch(`https://pd.premid.app/create/${url}`)
		).text();
		shortenedURLs[url] = pdURL;
		return pdURL;
	} catch (err) {
		presence.error(err);
		return url;
	}
}

enum Assets {
	Logo = "https://i.imgur.com/q3tKDRA.png",
	Reading = "https://i.imgur.com/8vMPNni.png",
	Searching = "https://i.imgur.com/oGQtnIY.png",
	Pause = "https://i.imgur.com/NyZsbVO.png",
	Play = "https://i.imgur.com/Y1m0KVP.png",
}

async function getStrings() {
	return presence.getStrings(
		{
			play: "general.playing",
			pause: "general.paused",
			featured: "spotify.featured",
			bestPodcasts: "spotify.bestPodcasts",
			charts: "spotify.charts",
			genres: "spotify.genres",
			latest: "spotify.latest",
			discover: "spotify.discover",
			browse: "spotify.browse",
			podcastLike: "spotify.podcastsLike",
			artistLike: "spotify.artistsLike",
			albumLike: "spotify.albumLike",
			songLike: "spotify.songsLike",
			forMeh: "spotify.madeForYou",
			playlist: "spotify.playlists",
			viewPlaylist: "general.viewPlaylist",
			download: "spotify.download",
			viewing: "general.viewing",
			account: "general.viewAccount",
			search: "general.search",
			searchFor: "general.searchFor",
			searchSomething: "general.searchSomething",
			browsing: "general.browsing",
			listening: "general.listeningMusic",
			show: "general.viewShow",
			artist: "general.buttonViewArtist",
			viewPodcast: "general.buttonViewPodcast",
			buttonViewPlaylist: "general.buttonViewPlaylist",
			viewHome: "general.viewHome",
			viewPage: "general.buttonViewPage",
		},
		await presence.getSetting<string>("lang").catch(() => "en")
	);
}

let strings: Awaited<ReturnType<typeof getStrings>>,
	oldLang: string = null;

presence.on("UpdateData", async () => {
	let presenceData: PresenceData = {
		largeImageKey: Assets.Logo,
	};

	//* Update strings if user selected another language.
	const [newLang, privacy, timestamps, cover, buttons] = await Promise.all([
			presence.getSetting<string>("lang").catch(() => "en"),
			presence.getSetting<boolean>("privacy"),
			presence.getSetting<boolean>("timestamps"),
			presence.getSetting<boolean>("cover"),
			presence.getSetting<boolean>("buttons"),
		]),
		{ href, pathname, hostname } = document.location;

	if (oldLang !== newLang || !strings) {
		oldLang = newLang;
		strings = await getStrings();
	}

	const pages: Record<string, PresenceData> = {
			"/browse/featured": {
				details: strings.browse,
				state: strings.featured,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/browse/podcasts": {
				details: strings.browse,
				state: strings.bestPodcasts,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/browse/charts": {
				details: strings.charts,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/browse/genres": {
				details: strings.browse,
				state: strings.genres,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/browse/latest": {
				details: strings.browse,
				state: strings.latest,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/browse/discover": {
				details: strings.discover,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/playlists": {
				details: strings.browse,
				state: strings.playlist,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/made-for-you": {
				details: strings.browse,
				state: strings.forMeh,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/tracks": {
				details: strings.browse,
				state: strings.songLike,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/albums": {
				details: strings.browse,
				state: strings.albumLike,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/artists": {
				details: strings.browse,
				state: strings.artistLike,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/podcasts": {
				details: strings.browse,
				state: strings.podcastLike,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/collection/episodes": {
				details: strings.browse,
				state: "my episodes",
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
			"/setting": {
				details: strings.account,
				buttons: [
					{
						label: strings.viewPage,
						url: href,
					},
				],
			},
		},
		albumCover = document.querySelector<HTMLAnchorElement>(
			":is(a[data-testid=cover-art-link], a[data-testid=context-link])"
		);

	for (const [path, data] of Object.entries(pages))
		if (pathname.includes(path)) presenceData = { ...presenceData, ...data };

	let searching = false;

	if (
		!(albumCover && /\/(show|episode)\/|your-episodes\?/.test(albumCover.href))
	) {
		if (timestamps) presenceData.startTimestamp = browsingStamp;
		presenceData.smallImageKey = Assets.Reading;
		presenceData.smallImageText = strings.browsing;
		switch (hostname) {
			case "open.spotify.com": {
				if (pathname === "/") presenceData.details = strings.viewHome;
				else if (pathname.includes("/search/")) {
					search = document.querySelector("input");
					searching = true;
					presenceData.details = strings.searchFor;
					presenceData.state = search.value;
					if (search.value.length <= 3) presenceData.state = "something...";
					presenceData.smallImageKey = Assets.Searching;
				} else if (pathname.includes("/search")) {
					searching = true;
					presenceData.details = strings.search;
					presenceData.smallImageKey = Assets.Searching;
				} else if (pathname.includes("/playlist/")) {
					const playlistCover = await getShortURL(
						document
							.querySelector(
								"div.Ws8Ec3GREpT5PAUesr9b > div > img.mMx2LUixlnN_Fu45JpFB"
							)
							?.getAttribute("src")
					);
					presenceData.details = strings.viewPlaylist;
					presenceData.state = document.querySelector(
						"div.RP2rRchy4i8TIp1CTmb7 > span.rEN7ncpaUeSGL9z0NGQR > h1"
					)?.textContent;
					presenceData.buttons = [
						{
							label: strings.buttonViewPlaylist,
							url: href,
						},
					];
					if (playlistCover) {
						presenceData.largeImageKey = playlistCover;
						presenceData.smallImageKey = Assets.Logo;
					}
				} else if (pathname.includes("/show/")) {
					presenceData.details = strings.show;
					presenceData.state = document.querySelector(
						"div.RP2rRchy4i8TIp1CTmb7 > span.rEN7ncpaUeSGL9z0NGQR > h1 > span"
					)?.textContent;
					presenceData.largeImageKey = await getShortURL(
						document
							.querySelector(
								"div.klz_XuZpllvTMzpJF1gw > div > img.mMx2LUixlnN_Fu45JpFB"
							)
							?.getAttribute("src")
					);
					presenceData.smallImageKey = Assets.Logo;
					presenceData.buttons = [
						{
							label: strings.artist,
							url: href,
						},
					];
				}
				break;
			}
			case "accounts.spotify.com": {
				if (pathname.includes("/login")) presenceData.details = "Logging in";
				break;
			}
			case "support.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Support Center";

				break;
			}
			case "investors.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Support Center";

				break;
			}
			case "developer.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Spotify for Developers";

				break;
			}
			case "artists.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Spotify for Artists";

				break;
			}
			case "newsroom.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Spotify for Newsroom";

				break;
			}
			case "podcasters.spotify.com": {
				presenceData.details = strings.browse;
				presenceData.state = "Spotify for Podcasters";

				break;
			}
			case "www.spotify.com": {
				if (pathname.includes("/premium")) {
					presenceData.details = strings.viewing;
					presenceData.state = "Spotify Premium";
					delete presenceData.smallImageKey;
				} else if (pathname.includes("/download")) {
					presenceData.details = strings.download;
					presenceData.smallImageKey = "downloading";
				} else if (pathname.includes("/account")) {
					presenceData.details = strings.account;
					delete presenceData.smallImageKey;
				}

				break;
			}
			// No default
		}
		const control = document.querySelector<HTMLButtonElement>(
			"div.player-controls__buttons > button"
		);
		if (
			document.querySelector(".now-playing-bar-hidden") !== null ||
			control === null ||
			control.dataset.testid === "control-button-play"
		) {
			if (!presenceData.details) presence.setActivity();
			else if (privacy) {
				if (searching) {
					presenceData.details = strings.searchSomething;
					delete presenceData.state;
				} else {
					presenceData.details = strings.browsing;
					delete presenceData.state;
					delete presenceData.smallImageKey;
				}
				presence.setActivity(presenceData);
			} else presence.setActivity(presenceData);
		} else {
			if (recentlyCleared < Date.now() - 1000) presence.clearActivity();

			recentlyCleared = Date.now();
		}
	} else {
		const currentTime = presence.timestampFromFormat(
				document.querySelector(".playback-bar").children[0].textContent ??
					"0:00"
			),
			duration = presence.timestampFromFormat(
				document.querySelector(".playback-bar").children[2].textContent ??
					"0:00"
			),
			pause =
				document
					.querySelector("[data-testid=control-button-playpause]")
					.getAttribute("aria-label") === "Play";

		presenceData.smallImageKey = pause ? Assets.Pause : Assets.Play;
		presenceData.smallImageText = pause ? strings.pause : strings.play;
		[, presenceData.endTimestamp] = presence.getTimestamps(
			currentTime,
			duration
		);

		if (pause || !timestamps) {
			delete presenceData.startTimestamp;
			delete presenceData.endTimestamp;
		}

		if (cover) {
			presenceData.largeImageKey = await getShortURL(
				albumCover.querySelector("img").src
			);
		}

		presenceData.details = document.querySelector(
			":is(a[nowplaying-track-link], a[data-testid=context-item-link"
		)?.textContent;
		presenceData.state = document.querySelector(
			":is(div[data-testid=track-info-artists], a[data-testid=context-item-info-show]"
		)?.textContent;

		presenceData.buttons = [
			{
				label: strings.viewPodcast,
				url: href,
			},
		];

		if (privacy) {
			presenceData.details = strings.listening;
			delete presenceData.state;
		}
	}

	if (!buttons && presenceData.buttons) delete presenceData.buttons;

	if (presenceData.details) presence.setActivity(presenceData);
	else presence.setActivity();
});
