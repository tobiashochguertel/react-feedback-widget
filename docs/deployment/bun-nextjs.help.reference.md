# Example for NextJS with bun and Docker

```bash
❯ tree -L 2
.
├── ARCHIVE
│   └── TEST-FAILURE-ANALYSIS.md
├── bin
│   ├── bun-install.ts
│   ├── edit-toml
│   └── edit-toml.ts
├── BUGZY_INTEGRATION.md
├── BUGZY_QUICKSTART.md
├── BUGZY_SUMMARY.md
├── bunfig.toml
├── bun.lock
├── config.yaml
├── content
│   ├── archive
│   ├── areas
│   ├── home.md
│   ├── index.md
│   ├── README.md
│   └── security-concept
├── DEPLOYMENT.md
├── docker-compose.override.yml
├── docker-compose.test.yml
├── docker-compose.yml
├── docker-entrypoint.sh
├── Dockerfile
├── Dockerfile.bak
├── docs
│   ├── bun-docs
│   ├── CODE_BLOCK_STYLE_SPEC.md
│   ├── CODE_BLOCK_STYLING_TESTS.md
│   ├── development
│   ├── FILE_TREE_BEHAVIOR_SPEC.md
│   ├── SERVICE.md
│   └── SHADCN_MARKDOWN_EVALUATION.md
├── INSTALL_WRAPPER.md
├── INTRO.md
├── node_modules
│   ├── acorn
│   ├── acorn-jsx
│   ├── ajv
│   ├── @alloc
│   ├── ansi-styles
│   ├── @antfu
│   ├── anymatch
│   ├── any-promise
│   ├── arg
│   ├── argparse
│   ├── aria-hidden
│   ├── aria-query
│   ├── array-buffer-byte-length
│   ├── arraybuffer.prototype.slice
│   ├── array-includes
│   ├── array.prototype.findlast
│   ├── array.prototype.findlastindex
│   ├── array.prototype.flat
│   ├── array.prototype.flatmap
│   ├── array.prototype.tosorted
│   ├── astring
│   ├── ast-types-flow
│   ├── async-function
│   ├── autoprefixer
│   ├── available-typed-arrays
│   ├── axe-core
│   ├── axobject-query
│   ├── @babel
│   ├── bail
│   ├── balanced-match
│   ├── base64-arraybuffer
│   ├── baseline-browser-mapping
│   ├── binary-extensions
│   ├── brace-expansion
│   ├── braces
│   ├── @braintree
│   ├── browserslist
│   ├── bundle-require
│   ├── bun-types
│   ├── cac
│   ├── call-bind
│   ├── call-bind-apply-helpers
│   ├── call-bound
│   ├── callsites
│   ├── camelcase-css
│   ├── camelize
│   ├── caniuse-lite
│   ├── ccount
│   ├── chalk
│   ├── character-entities
│   ├── character-entities-html4
│   ├── character-entities-legacy
│   ├── character-reference-invalid
│   ├── char-regex
│   ├── @chevrotain
│   ├── chevrotain
│   ├── chevrotain-allstar
│   ├── chokidar
│   ├── class-variance-authority
│   ├── client-only
│   ├── clsx
│   ├── cmdk
│   ├── collapse-white-space
│   ├── color-convert
│   ├── color-name
│   ├── commander
│   ├── comma-separated-tokens
│   ├── concat-map
│   ├── confbox
│   ├── consola
│   ├── core-util-is
│   ├── cose-base
│   ├── cross-spawn
│   ├── css-color-keywords
│   ├── cssesc
│   ├── css-line-break
│   ├── css-to-react-native
│   ├── csstype
│   ├── cytoscape
│   ├── cytoscape-cose-bilkent
│   ├── cytoscape-fcose
│   ├── d3
│   ├── d3-array
│   ├── d3-axis
│   ├── d3-brush
│   ├── d3-chord
│   ├── d3-color
│   ├── d3-contour
│   ├── d3-delaunay
│   ├── d3-dispatch
│   ├── d3-drag
│   ├── d3-dsv
│   ├── d3-ease
│   ├── d3-fetch
│   ├── d3-force
│   ├── d3-format
│   ├── d3-geo
│   ├── d3-hierarchy
│   ├── d3-interpolate
│   ├── d3-path
│   ├── d3-polygon
│   ├── d3-quadtree
│   ├── d3-random
│   ├── d3-sankey
│   ├── d3-scale
│   ├── d3-scale-chromatic
│   ├── d3-selection
│   ├── d3-shape
│   ├── d3-time
│   ├── d3-time-format
│   ├── d3-timer
│   ├── d3-transition
│   ├── d3-zoom
│   ├── dagre-d3-es
│   ├── damerau-levenshtein
│   ├── data-view-buffer
│   ├── data-view-byte-length
│   ├── data-view-byte-offset
│   ├── dayjs
│   ├── debug
│   ├── decode-named-character-reference
│   ├── deep-is
│   ├── define-data-property
│   ├── define-properties
│   ├── delaunator
│   ├── dequal
│   ├── detect-libc
│   ├── detect-node-es
│   ├── devlop
│   ├── didyoumean
│   ├── dlv
│   ├── doctrine
│   ├── dompurify
│   ├── dunder-proto
│   ├── electron-to-chromium
│   ├── emojilib
│   ├── emoji-regex
│   ├── emoticon
│   ├── @emotion
│   ├── entities
│   ├── es-abstract
│   ├── esast-util-from-estree
│   ├── esast-util-from-js
│   ├── @esbuild
│   ├── esbuild
│   ├── escalade
│   ├── escape-string-regexp
│   ├── es-define-property
│   ├── es-errors
│   ├── es-iterator-helpers
│   ├── @eslint
│   ├── eslint
│   ├── @eslint-community
│   ├── eslint-config-next
│   ├── eslint-import-resolver-node
│   ├── eslint-import-resolver-typescript
│   ├── eslint-module-utils
│   ├── eslint-plugin-import
│   ├── eslint-plugin-jsx-a11y
│   ├── eslint-plugin-react
│   ├── eslint-plugin-react-hooks
│   ├── eslint-scope
│   ├── eslint-visitor-keys
│   ├── es-object-atoms
│   ├── espree
│   ├── esprima
│   ├── esquery
│   ├── esrecurse
│   ├── es-set-tostringtag
│   ├── es-shim-unscopables
│   ├── es-to-primitive
│   ├── estraverse
│   ├── estree-util-attach-comments
│   ├── estree-util-build-jsx
│   ├── estree-util-is-identifier-name
│   ├── estree-util-scope
│   ├── estree-util-to-js
│   ├── estree-util-visit
│   ├── estree-walker
│   ├── esutils
│   ├── extend
│   ├── extend-shallow
│   ├── fast-deep-equal
│   ├── fast-glob
│   ├── fast-json-stable-stringify
│   ├── fast-levenshtein
│   ├── fastq
│   ├── fault
│   ├── fdir
│   ├── file-entry-cache
│   ├── file-saver
│   ├── fill-range
│   ├── find-up
│   ├── fix-dts-default-cjs-exports
│   ├── flat-cache
│   ├── flatted
│   ├── @floating-ui
│   ├── for-each
│   ├── format
│   ├── fraction.js
│   ├── function-bind
│   ├── function.prototype.name
│   ├── functions-have-names
│   ├── generator-function
│   ├── get-intrinsic
│   ├── get-nonce
│   ├── get-proto
│   ├── get-symbol-description
│   ├── get-tsconfig
│   ├── github-slugger
│   ├── globals
│   ├── globalthis
│   ├── glob-parent
│   ├── gopd
│   ├── gray-matter
│   ├── hachure-fill
│   ├── has-bigints
│   ├── has-flag
│   ├── hasown
│   ├── has-property-descriptors
│   ├── has-proto
│   ├── has-symbols
│   ├── has-tostringtag
│   ├── hastscript
│   ├── hast-util-from-dom
│   ├── hast-util-from-html
│   ├── hast-util-from-html-isomorphic
│   ├── hast-util-from-parse5
│   ├── hast-util-heading-rank
│   ├── hast-util-is-element
│   ├── hast-util-parse-selector
│   ├── hast-util-raw
│   ├── hast-util-to-estree
│   ├── hast-util-to-jsx-runtime
│   ├── hast-util-to-parse5
│   ├── hast-util-to-string
│   ├── hast-util-to-text
│   ├── hast-util-whitespace
│   ├── highlight.js
│   ├── highlightjs-vue
│   ├── @hochguertel
│   ├── html2canvas
│   ├── html-url-attributes
│   ├── html-void-elements
│   ├── @humanfs
│   ├── @humanwhocodes
│   ├── @iconify
│   ├── iconv-lite
│   ├── ignore
│   ├── @img
│   ├── immediate
│   ├── import-fresh
│   ├── imurmurhash
│   ├── inherits
│   ├── inline-style-parser
│   ├── internal-slot
│   ├── internmap
│   ├── is-alphabetical
│   ├── is-alphanumerical
│   ├── isarray
│   ├── is-array-buffer
│   ├── is-async-function
│   ├── is-bigint
│   ├── is-binary-path
│   ├── is-boolean-object
│   ├── is-bun-module
│   ├── is-callable
│   ├── is-core-module
│   ├── is-data-view
│   ├── is-date-object
│   ├── is-decimal
│   ├── isexe
│   ├── is-extendable
│   ├── is-extglob
│   ├── is-finalizationregistry
│   ├── is-generator-function
│   ├── is-glob
│   ├── is-hexadecimal
│   ├── is-map
│   ├── is-negative-zero
│   ├── is-number
│   ├── is-number-object
│   ├── is-plain-obj
│   ├── is-regex
│   ├── is-set
│   ├── is-shared-array-buffer
│   ├── is-string
│   ├── is-symbol
│   ├── is-typed-array
│   ├── is-weakmap
│   ├── is-weakref
│   ├── is-weakset
│   ├── iterator.prototype
│   ├── jiti
│   ├── joycon
│   ├── @jridgewell
│   ├── json5
│   ├── json-buffer
│   ├── json-schema-traverse
│   ├── json-stable-stringify-without-jsonify
│   ├── js-tokens
│   ├── jsx-ast-utils
│   ├── js-yaml
│   ├── jszip
│   ├── katex
│   ├── keyv
│   ├── khroma
│   ├── kind-of
│   ├── langium
│   ├── language-subtag-registry
│   ├── language-tags
│   ├── layout-base
│   ├── levn
│   ├── lie
│   ├── lilconfig
│   ├── lines-and-columns
│   ├── load-tsconfig
│   ├── locate-path
│   ├── lodash-es
│   ├── lodash.merge
│   ├── longest-streak
│   ├── loose-envify
│   ├── lowlight
│   ├── lucide-react
│   ├── magic-string
│   ├── markdown-extensions
│   ├── markdown-table
│   ├── marked
│   ├── math-intrinsics
│   ├── mdast-util-find-and-replace
│   ├── mdast-util-from-markdown
│   ├── mdast-util-gfm
│   ├── mdast-util-gfm-autolink-literal
│   ├── mdast-util-gfm-footnote
│   ├── mdast-util-gfm-strikethrough
│   ├── mdast-util-gfm-table
│   ├── mdast-util-gfm-task-list-item
│   ├── mdast-util-math
│   ├── mdast-util-mdx
│   ├── mdast-util-mdx-expression
│   ├── mdast-util-mdxjs-esm
│   ├── mdast-util-mdx-jsx
│   ├── mdast-util-phrasing
│   ├── mdast-util-to-hast
│   ├── mdast-util-to-markdown
│   ├── mdast-util-to-string
│   ├── @mdx-js
│   ├── merge2
│   ├── mermaid
│   ├── @mermaid-js
│   ├── micromark
│   ├── micromark-core-commonmark
│   ├── micromark-extension-gfm
│   ├── micromark-extension-gfm-autolink-literal
│   ├── micromark-extension-gfm-footnote
│   ├── micromark-extension-gfm-strikethrough
│   ├── micromark-extension-gfm-table
│   ├── micromark-extension-gfm-tagfilter
│   ├── micromark-extension-gfm-task-list-item
│   ├── micromark-extension-math
│   ├── micromark-extension-mdx-expression
│   ├── micromark-extension-mdxjs
│   ├── micromark-extension-mdxjs-esm
│   ├── micromark-extension-mdx-jsx
│   ├── micromark-extension-mdx-md
│   ├── micromark-factory-destination
│   ├── micromark-factory-label
│   ├── micromark-factory-mdx-expression
│   ├── micromark-factory-space
│   ├── micromark-factory-title
│   ├── micromark-factory-whitespace
│   ├── micromark-util-character
│   ├── micromark-util-chunked
│   ├── micromark-util-classify-character
│   ├── micromark-util-combine-extensions
│   ├── micromark-util-decode-numeric-character-reference
│   ├── micromark-util-decode-string
│   ├── micromark-util-encode
│   ├── micromark-util-events-to-acorn
│   ├── micromark-util-html-tag-name
│   ├── micromark-util-normalize-identifier
│   ├── micromark-util-resolve-all
│   ├── micromark-util-sanitize-uri
│   ├── micromark-util-subtokenize
│   ├── micromark-util-symbol
│   ├── micromark-util-types
│   ├── micromatch
│   ├── minimatch
│   ├── minimist
│   ├── mlly
│   ├── modern-screenshot
│   ├── ms
│   ├── mz
│   ├── nanoid
│   ├── napi-postinstall
│   ├── natural-compare
│   ├── @next
│   ├── next
│   ├── next-themes
│   ├── node-emoji
│   ├── @nodelib
│   ├── node-releases
│   ├── @nolyfill
│   ├── normalize-path
│   ├── object-assign
│   ├── object.assign
│   ├── object.entries
│   ├── object.fromentries
│   ├── object.groupby
│   ├── object-hash
│   ├── object-inspect
│   ├── object-keys
│   ├── object.values
│   ├── optionator
│   ├── own-keys
│   ├── package-manager-detector
│   ├── pako
│   ├── parent-module
│   ├── parse5
│   ├── parse-entities
│   ├── path-data-parser
│   ├── pathe
│   ├── path-exists
│   ├── path-key
│   ├── path-parse
│   ├── picocolors
│   ├── picomatch
│   ├── pify
│   ├── pirates
│   ├── pkg-types
│   ├── p-limit
│   ├── p-locate
│   ├── points-on-curve
│   ├── points-on-path
│   ├── possible-typed-array-names
│   ├── postcss
│   ├── postcss-import
│   ├── postcss-js
│   ├── postcss-load-config
│   ├── postcss-nested
│   ├── postcss-selector-parser
│   ├── postcss-value-parser
│   ├── prelude-ls
│   ├── prismjs
│   ├── process-nextick-args
│   ├── property-information
│   ├── prop-types
│   ├── punycode
│   ├── queue-microtask
│   ├── @radix-ui
│   ├── react
│   ├── react-complex-tree
│   ├── react-dom
│   ├── react-is
│   ├── react-markdown
│   ├── react-remove-scroll
│   ├── react-remove-scroll-bar
│   ├── react-style-singleton
│   ├── react-syntax-highlighter
│   ├── react-visual-feedback
│   ├── readable-stream
│   ├── read-cache
│   ├── readdirp
│   ├── recma-build-jsx
│   ├── recma-jsx
│   ├── recma-parse
│   ├── recma-stringify
│   ├── reflect.getprototypeof
│   ├── refractor
│   ├── regexp.prototype.flags
│   ├── rehype-katex
│   ├── rehype-raw
│   ├── rehype-recma
│   ├── rehype-slug
│   ├── remark-emoji
│   ├── remark-gfm
│   ├── remark-math
│   ├── remark-mdx
│   ├── remark-parse
│   ├── remark-rehype
│   ├── remark-stringify
│   ├── resolve
│   ├── resolve-from
│   ├── resolve-pkg-maps
│   ├── reusify
│   ├── robust-predicates
│   ├── @rollup
│   ├── rollup
│   ├── roughjs
│   ├── @rtsao
│   ├── run-parallel
│   ├── @rushstack
│   ├── rw
│   ├── safe-array-concat
│   ├── safe-buffer
│   ├── safe-push-apply
│   ├── safer-buffer
│   ├── safe-regex-test
│   ├── scheduler
│   ├── section-matter
│   ├── semver
│   ├── set-function-length
│   ├── set-function-name
│   ├── setimmediate
│   ├── set-proto
│   ├── shallowequal
│   ├── sharp
│   ├── shebang-command
│   ├── shebang-regex
│   ├── side-channel
│   ├── side-channel-list
│   ├── side-channel-map
│   ├── side-channel-weakmap
│   ├── @sindresorhus
│   ├── skin-tone
│   ├── smol-toml -> .bun/smol-toml@1.6.0/node_modules/smol-toml
│   ├── source-map
│   ├── source-map-js
│   ├── space-separated-tokens
│   ├── sprintf-js
│   ├── stable-hash
│   ├── stop-iteration-iterator
│   ├── string_decoder
│   ├── stringify-entities
│   ├── string.prototype.includes
│   ├── string.prototype.matchall
│   ├── string.prototype.repeat
│   ├── string.prototype.trim
│   ├── string.prototype.trimend
│   ├── string.prototype.trimstart
│   ├── strip-bom
│   ├── strip-bom-string
│   ├── strip-json-comments
│   ├── styled-components
│   ├── styled-jsx
│   ├── style-to-js
│   ├── style-to-object
│   ├── stylis
│   ├── sucrase
│   ├── supports-color
│   ├── supports-preserve-symlinks-flag
│   ├── @swc
│   ├── @tailwindcss
│   ├── tailwindcss
│   ├── tailwindcss-animate
│   ├── tailwind-merge
│   ├── text-segmentation
│   ├── thenify
│   ├── thenify-all
│   ├── tinyexec
│   ├── tinyglobby
│   ├── to-regex-range
│   ├── tree-kill
│   ├── trim-lines
│   ├── trough
│   ├── ts-api-utils
│   ├── tsconfig-paths
│   ├── ts-dedent
│   ├── ts-interface-checker
│   ├── tslib
│   ├── tsup
│   ├── type-check
│   ├── typed-array-buffer
│   ├── typed-array-byte-length
│   ├── typed-array-byte-offset
│   ├── typed-array-length
│   ├── @types
│   ├── typescript -> .bun/typescript@5.9.3/node_modules/typescript
│   ├── @typescript-eslint
│   ├── ufo
│   ├── unbox-primitive
│   ├── undici-types
│   ├── @ungap
│   ├── unicode-emoji-modifier-base
│   ├── unified
│   ├── unist-util-find-after
│   ├── unist-util-is
│   ├── unist-util-position
│   ├── unist-util-position-from-estree
│   ├── unist-util-remove-position
│   ├── unist-util-stringify-position
│   ├── unist-util-visit
│   ├── unist-util-visit-parents
│   ├── @unrs
│   ├── unrs-resolver
│   ├── update-browserslist-db
│   ├── uri-js
│   ├── use-callback-ref
│   ├── use-sidecar
│   ├── util-deprecate
│   ├── utrie
│   ├── uuid
│   ├── vfile
│   ├── vfile-location
│   ├── vfile-message
│   ├── vscode-jsonrpc
│   ├── vscode-languageserver
│   ├── vscode-languageserver-protocol
│   ├── vscode-languageserver-textdocument
│   ├── vscode-languageserver-types
│   ├── vscode-uri
│   ├── web-namespaces
│   ├── which
│   ├── which-boxed-primitive
│   ├── which-builtin-type
│   ├── which-collection
│   ├── which-typed-array
│   ├── word-wrap
│   ├── yocto-queue
│   └── zwitch
├── package.json
├── packages
│   ├── feedback
│   └── viewer
├── README.md
├── RESPONSIVE_DESIGN_FIXES.md
├── scripts
│   └── README.md
├── SIDEBAR_STATUS.md
├── Taskfile.yml
├── TASKS.2.md
├── TASKS.3.md
├── TASKS.md
├── TASKS.md.backup
├── TASKS_OLD.md
├── TESTING.md
├── TEST_RESULTS_DECISION_CATALOG.md
├── TEST-RESULTS.md
├── TEST_RESULTS_SUMMARY.md
├── tests
│   ├── e2e
│   ├── __init__.py
│   ├── integration
│   ├── README.md
│   └── unit
├── tsconfig.json
└── tsconfig.tsbuildinfo

629 directories, 46 files
```

## File: `dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7

# ============================================
# Base stage with tools
# ============================================
ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-debian AS base

# Install runtime dependencies
# RUN apk add --no-cache wget curl bash findutils tree
RUN apt-get update && apt-get install -y wget curl bash findutils tree && apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
WORKDIR /workspace
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG NODE_ENV=production

# Copy root package.json, lock files, bunfig.toml, tsconfig.json and bin scripts
COPY package.json bun.lock* bunfig.toml tsconfig.json ./
ADD bin/ ./bin/

# Copy all package manifests and source code
# Note: We need full directory structure for workspace resolution
COPY packages/ ./packages/

# The shell form is most commonly used, and lets you break up longer instructions into multiple lines, either using newline escapes, or with heredocs:
# RUN <<EOF
# apt-get update
# apt-get install -y curl
# EOF

# Debug: List all package.json files, bun.lock* files, bunfig.toml files, tsconfig.json and bin scripts found
RUN echo "Listing package.json, bun.lock*, bunfig.toml, tsconfig.json and bin scripts in workspace..." && \
    find . -type f \( -name "package.json" -o -name "bun.lock" -o -name "bun.lockb" -o -name "bunfig.toml" -o -name "tsconfig.json" \) -print && \
    echo "Listing workspace files..." && \
    ls -l . || true && \
    echo "Listing workspace/bin files..." && \
    ls -l bin || true

# Remove any existing node_modules in packages (if copied)
RUN echo "Finding node_modules directories..." && \
    count=$(find packages -type d -name node_modules | wc -l) && \
    echo "Found $count node_modules to remove" && \
    find packages -type d -name node_modules -print -exec rm -rf {} + 2>/dev/null || true && \
    echo "Cleanup complete"

# Install all dependencies (including devDependencies for building)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    echo "Current WORKDIR: $(pwd)" && \
    echo "Listing workspace files before install..." && \
    ls -l . && \
    echo "Showing edit-toml help..." && \
    ./bin/edit-toml --help && \
    echo "Setting bunfig.toml to reproducible installs..." && \
    bun run set-reproducible && \
    echo "Current bunfig.toml content:" && \
    cat ./bunfig.toml && \
    echo "root: Installing dependencies with bun..." && \
    bun install && \
    echo "packages: Installing dependencies with bun..." && \
    bun run install:all

# Build workspace packages (feedback widget, etc.)
# RUN for pkg in packages/*; do \
#       if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then \
#         cd "$pkg" && \
#         if grep -q '"build": ' package.json; then \
#           echo "Building $pkg..." && \
#           bun run build; \
#         fi && \
#         cd /workspace; \
#       fi; \
#     done

# 1. Debug the current state of the working directory without node_modules
# 2. Debug the current state of the working directory without node_modules as tree
# RUN /usr/bin/find . -maxdepth 2 -type f -not -path "*/node_modules/*" -exec ls -l {} + \
#     /usr/bin/tree -L 2 -I 'node_modules|.next|dist|.git|.bun|__pycache__'

# ============================================
# Builder stage
# ============================================
FROM base AS builder
WORKDIR /workspace

ARG NODE_ENV=production
ARG GIT_SHA=unknown
ARG ENABLE_FEEDBACK_WIDGET=true

# Copy entire project (respects .dockerignore)
COPY . .

# Copy built dependencies from deps stage
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages/viewer/node_modules ./packages/viewer/node_modules
COPY --from=deps /workspace/packages/feedback/node_modules ./packages/feedback/node_modules

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GIT_SHA=${GIT_SHA}
ENV NEXT_PUBLIC_ENABLE_FEEDBACK_WIDGET=${ENABLE_FEEDBACK_WIDGET}

# Build Next.js app using bun workspace command from root
# Debug: Check next binary availability
RUN bun run debug:viewer-which || true
RUN bun run debug:viewer-version || true

# Actual build
RUN --mount=type=cache,target=/workspace/packages/viewer/.next/cache \
    echo "root: Building..." && \
    bun run build && \
    echo "Listing feedback package directory:" && \
    ls -l ./packages/feedback/ && \
    echo "Listing viewer package directory:" && \
    ls -l ./packages/viewer/

# ============================================
# Production runner
# ============================================
FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV CONTENT_DIR="/content"

ARG GIT_SHA=unknown
ARG ENABLE_FEEDBACK_WIDGET=true
ENV NEXT_PUBLIC_GIT_SHA=${GIT_SHA}
ENV NEXT_PUBLIC_ENABLE_FEEDBACK_WIDGET=${ENABLE_FEEDBACK_WIDGET}

# Create non-root user
# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nextjs

# Debian-based user creation
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nextjs

# Copy production build artifacts from standalone build
# IMPORTANT: Recreate the monorepo structure to preserve Bun workspace symlinks!
# The standalone build creates viewer/ with symlinks like:
#   viewer/node_modules/next -> ../../../node_modules/.bun/next@.../node_modules/next
# These symlinks expect the workspace root structure:
#   /workspace/node_modules/.bun/...
#   /workspace/packages/viewer/...

# Copy root workspace node_modules (contains .bun/ with actual packages)
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules

# Copy standalone output to packages/viewer/ to match original structure
# The standalone output is in .next/standalone/viewer/, we copy it to packages/viewer/
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/.next/standalone/viewer ./packages/viewer

# Copy static assets and public files
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/.next/static ./packages/viewer/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/public ./packages/viewer/public

# ============================================
# DEBUG: Analyze file structure and symlinks
# ============================================
RUN echo "======================================" && \
    echo "DEBUG: Analyzing /workspace structure" && \
    echo "======================================" && \
    echo "" && \
    echo "1. TREE VIEW (with symlinks, 5 levels deep):" && \
    echo "-------------------------------------------" && \
    tree -L 5 -a -l /workspace && \
    echo "" && \
    echo "2. ROOT DIRECTORY LISTING:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace && \
    echo "" && \
    echo "3. FINDING ALL server.js FILES:" && \
    echo "-------------------------------------------" && \
    find /workspace -name "server.js" -type f -ls && \
    echo "" && \
    echo "4. FINDING ALL SYMLINKS:" && \
    echo "-------------------------------------------" && \
    find /workspace -type l -ls && \
    echo "" && \
    echo "5. CHECKING packages/viewer STRUCTURE:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/packages/viewer/ 2>/dev/null || echo "No packages/viewer directory" && \
    echo "" && \
    echo "6. CHECKING packages/viewer/node_modules:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/packages/viewer/node_modules 2>/dev/null || echo "No packages/viewer/node_modules" && \
    echo "" && \
    echo "7. TESTING SYMLINK: Does next exist?" && \
    echo "-------------------------------------------" && \
    if [ -L "/workspace/packages/viewer/node_modules/next" ]; then \
      echo "Symlink: $(readlink /workspace/packages/viewer/node_modules/next)" && \
      echo "Target exists: $(test -e /workspace/packages/viewer/node_modules/next && echo 'YES ✓' || echo 'NO ✗')"; \
    else \
      echo "No next symlink found"; \
    fi && \
    echo "" && \
    echo "8. CHECKING FOR node_modules DIRECTORIES:" && \
    echo "-------------------------------------------" && \
    find /workspace -name "node_modules" -type d -o -name "node_modules" -type l && \
    echo "" && \
    echo "9. CHECKING ROOT node_modules/.bun:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/node_modules/.bun 2>/dev/null | head -20 || echo "No .bun directory" && \
    echo "" && \
    echo "10. DISK USAGE SUMMARY:" && \
    echo "-------------------------------------------" && \
    du -sh /workspace/* 2>/dev/null | sort -h && \
    echo "" && \
    echo "======================================" && \
    echo "DEBUG: Analysis complete" && \
    echo "======================================"

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /workspace/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
# The standalone build puts server.js in packages/viewer/
# Use bun to run it (not node) to avoid cpu-profile and other Node.js-specific issues
CMD ["bun", "packages/viewer/server.js"]
```

## File: `docker-entrypoint.sh`

```bash
#!/usr/bin/env bash
set -e

# Create content directory if it doesn't exist
mkdir -p /content

# Fix permissions on mounted volume (only if writable)
if [ -w /content ]; then
    echo "Fixing content directory permissions..."
    chown -R nextjs:nodejs /content 2>/dev/null || true
fi

# Execute the CMD
exec "$@"
```

---

# Available

```bash
git clone https://pastoral-oyster.pikapod.net/hochguertel.work/entrypoint.git
cd ./entrypoint/markdown-viewer
```
