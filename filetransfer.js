//////////////////// Polyfills
Number.prototype.toFilesize = function () {
    const byte = 1
    const kilobyte = byte * 1000
    const megabyte = kilobyte * 1000
    const gigabyte = megabyte * 1000
    if (this > gigabyte) return (this / gigabyte).toFixed(2) + ' GB'
    if (this > megabyte) return (this / megabyte).toFixed(2) + ' MB'
    if (this > kilobyte) return (this / kilobyte).toFixed(2) + ' KB'
    return this + ' bytes'
}

window.copy = t => {
    const el = document.createElement('textarea')
    el.value = t
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    if (selected) {
        document.getSelection().removeAllRanges()
        document.getSelection().addRange(selected)
    }
}
////////////////////////////////////////////////////////////////

const state = VueP('aiko-file-transfer')
// for allowing the possibility of persistence && auth in the future

state.ignoreMany(
    'loading',
    'error',
    'client',
    'torrent',
    'magnet',
    'finishedTorrents',
    'addedTorrents'
)

const app = new Vue({
    el: '#app',
    data: {
        // General
        loading: true,
        error: '',
        // WebTorrent
        client: null,
        torrent: null,
        magnet: '',
        finishedTorrents: [],
        addedTorrents: []
    },
    computed: {
        browserSupported() {
            return (!!window.WebTorrent && window.WebTorrent.WEBRTC_SUPPORT && !!window.DragDrop)
        },
        magnetValid() {
            return (!!this.magnet && /magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32}/i.test(this.magnet))
        },
        shareLink() {
            return window.location.origin + '/#' + torrent.magnetURI
        }
    },
    methods: {
        async init() {
            this.client = new WebTorrent()
            await state.save(app)
            this.loading = false
        },
        async maybeSeed() {
            const files = document.getElementById('file').files
            if (files) await this.seed(files)
        },
        async seed(files) {
            this.loading = true
            if (!files || !files.length || files.length == 0) return;
            this.client.seed(files, torrent => {
                app.torrent = torrent
                app.loading = false
            })
        },
        async download() {
            this.loading = true
            if (!this.magnetValid) return (this.error = 'Magnet URI is not valid 😢');
            const metadata = this.client.add(this.magnet, torrent => {
                this.finishedTorrents.push(torrent)
                this.addedTorrents = this.addedTorrents.filter(t => t.magnetURI != torrent.magnetURI)
                this.loading = false
            })
            this.addedTorrents.push(metadata)
        },
        async copy(t) {
            window.copy(t)
        }
    }
})

state.load(app).then(async () => {
    app.loading = true
    if (window.location.hash) {
        app.magnet = window.location.hash.slice(1)
        if (!app.magnetValid) app.magnet = ''
    }
    if (app.browserSupported) await app.init()
    if (app.magnet && app.magnetValid) app.download() // if we've put a magnet in already, start the download of that torrent
    DragDrop('body', files => app.seed(files))
}).catch(async e => {
    await state.clear()
    console.error(e)
})