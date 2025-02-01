;; BrightMint - A platform for minting bright ideas
(define-non-fungible-token brightidea uint)

;; Constants 
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-not-found (err u102))
(define-constant err-already-liked (err u103))
(define-constant err-comment-too-long (err u104))
(define-constant err-reward-claim-failed (err u105))

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var reward-pool uint u0)

(define-map token-metadata uint 
  {
    title: (string-utf8 256),
    description: (string-utf8 1024),
    creator: principal,
    created-at: uint,
    likes: uint,
    rewards-claimed: uint
  }
)

(define-map user-likes (tuple (user principal) (token-id uint)) bool)

(define-map token-comments uint (list 20 {
  author: principal,
  text: (string-utf8 280),
  created-at: uint
}))

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
        likes: u0,
        rewards-claimed: u0
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
    (var-set reward-pool (+ (var-get reward-pool) u1))
    (ok true)
  )
)

;; Add comment
(define-public (add-comment (token-id uint) (text (string-utf8 280)))
  (let
    (
      (comments (default-to (list) (map-get? token-comments token-id)))
      (new-comment {
        author: tx-sender,
        text: text,
        created-at: block-height
      })
    )
    (asserts! (<= (len comments) u20) err-comment-too-long)
    (map-set token-comments token-id (unwrap! (as-max-len? (append comments new-comment) u20) err-comment-too-long))
    (ok true)
  )
)

;; Claim rewards
(define-public (claim-rewards (token-id uint))
  (let
    (
      (metadata (unwrap! (map-get? token-metadata token-id) err-token-not-found))
      (owner (unwrap! (nft-get-owner? brightidea token-id) err-token-not-found))
      (likes (get likes metadata))
      (claimed (get rewards-claimed metadata))
      (available (- likes claimed))
    )
    (asserts! (> available u0) err-reward-claim-failed)
    (asserts! (is-eq tx-sender owner) err-not-token-owner)
    (map-set token-metadata token-id (merge metadata {rewards-claimed: likes}))
    (var-set reward-pool (- (var-get reward-pool) available))
    (ok available)
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

(define-read-only (get-token-comments (token-id uint))
  (ok (default-to (list) (map-get? token-comments token-id)))
)

(define-read-only (get-reward-pool)
  (ok (var-get reward-pool))
)
