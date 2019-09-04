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

const ext2icon = ext => {
    switch (ext) {
        case 'gz': return 'fa-file-archive';
        case 'zip': return 'fa-file-archive';
        case 'tar': return 'fa-file-archive';
        case '7z': return 'fa-file-archive';
        case 'rar': return 'fa-file-archive';

        case 'mp3': return 'fa-file-audio';
        case 'aac': return 'fa-file-audio';
        case 'ogg': return 'fa-file-audio';
        case 'wav': return 'fa-file-audio';
        case 'raw': return 'fa-file-audio';

        case 'js': return 'fa-file-code';
        case 'css': return 'fa-file-code';
        case 'cpp': return 'fa-file-code';
        case 'java': return 'fa-file-code';
        case 'class': return 'fa-file-code';
        case 'py': return 'fa-file-code';
        case 'cs': return 'fa-file-code';
        case 'gml': return 'fa-file-code';
        case 'bin': return 'fa-file-code';
        case 'asm': return 'fa-file-code';
        case 'pl': return 'fa-file-code';
        case 'hs': return 'fa-file-code';
        case 'jsx': return 'fa-file-code';
        case 'ts': return 'fa-file-code';
        case 'html': return 'fa-file-code';
        case 'json': return 'fa-file-code';
        case 'sh': return 'fa-file-code';
        case 'env': return 'fa-file-code';

        case 'xls': return 'fa-file-excel';
        case 'xlsx': return 'fa-file-excel';
        case 'csv': return 'fa-file-excel';
        case 'numbers': return 'fa-file-excel';

        case 'jpg': return 'fa-file-image';
        case 'jpeg': return 'fa-file-image';
        case 'png': return 'fa-file-image';
        case 'gif': return 'fa-file-image';
        case 'psd': return 'fa-file-image';
        case 'ai': return 'fa-file-image';
        case 'tiff': return 'fa-file-image';
        case 'bmp': return 'fa-file-image';
        case 'riff': return 'fa-file-image';
        case 'xbmp': return 'fa-file-image';
        case 'webp': return 'fa-file-image';

        case 'mp4': return 'fa-file-movie';
        case 'avi': return 'fa-file-movie';
        case 'wmv': return 'fa-file-movie';
        case 'flv': return 'fa-file-movie';
        case 'mov': return 'fa-file-movie';
        case 'webm': return 'fa-file-movie';
        case 'mpeg': return 'fa-file-movie';
        case 'mpg': return 'fa-file-movie';
        case 'mpv': return 'fa-file-movie';

        case 'doc': return 'fa-file-word';
        case 'docx': return 'fa-file-word';
        case 'txt': return 'fa-file-text';
        case 'pdf': return 'fa-file-pdf';

        case 'ppt': return 'fa-file-powerpoint';
        case 'pptx': return 'fa-file-powerpoint';
        case 'odp': return 'fa-file-powerpoint';

        default: return 'fa-file';
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
            return window.location.origin + '/#' + this.torrent.magnetURI
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
            this.client.seed(files, {
                    announce: ['wss://tracker.openwebtorrent.com']
                },
                torrent => {
                    app.torrent = torrent
                    app.loading = false
                })
        },
        async download() {
            this.loading = true
            if (!this.magnetValid) return (this.error = 'Magnet URI is not valid 😢');
            const metadata = this.client.add(this.magnet, async torrent => {
                this.finishedTorrents.push(torrent)
                this.addedTorrents = this.addedTorrents.filter(t => t.magnetURI != torrent.magnetURI)
                this.loading = false
            })
            this.addedTorrents.push(metadata)
        },
        async copy(t) {
            window.copy(t)
        },
        file2icon(fn) {
            return ext2icon(fn.split('.').reduceRight(_ => _))
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