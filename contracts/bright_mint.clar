;; BrightMint - A platform for minting bright ideas
(define-non-fungible-token brightidea uint)

;; Constants 
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-not-found (err u102))
(define-constant err-already-liked (err u103))

;; Data variables
(define-data-var last-token-id uint u0)
(define-map token-metadata uint 
  {
    title: (string-utf8 256),
    description: (string-utf8 1024),
    creator: principal,
    created-at: uint,
    likes: uint
  }
)

(define-map user-likes (tuple (user principal) (token-id uint)) bool)

;; Mint new idea
(define-public (mint-idea (title (string-utf8 256)) (description (string-utf8 1024)))
  (let 
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (try! (nft-mint? brightidea token-id tx-sender))
    (map-set token-metadata token-id
      {
        title: title,
        description: description,
        creator: tx-sender,
        created-at: block-height,
        likes: u0
      }
    )
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Transfer idea
(define-public (transfer-idea (token-id uint) (recipient principal))
  (let
    (
      (owner (unwrap! (nft-get-owner? brightidea token-id) err-token-not-found))
    )
    (asserts! (is-eq tx-sender owner) err-not-token-owner)
    (try! (nft-transfer? brightidea token-id tx-sender recipient))
    (ok true)
  )
)

;; Like an idea
(define-public (like-idea (token-id uint))
  (let
    (
      (metadata (unwrap! (map-get? token-metadata token-id) err-token-not-found))
      (user-token-like {user: tx-sender, token-id: token-id})
    )
    (asserts! (not (default-to false (map-get? user-likes user-token-like))) err-already-liked)
    (map-set token-metadata token-id (merge metadata {likes: (+ (get likes metadata) u1)}))
    (map-set user-likes user-token-like true)
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-token-metadata (token-id uint))
  (ok (unwrap! (map-get? token-metadata token-id) err-token-not-found))
)

(define-read-only (get-token-owner (token-id uint))
  (ok (nft-get-owner? brightidea token-id))
)

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)