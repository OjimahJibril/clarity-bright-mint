import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can mint a new idea",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const title = "My Bright Idea";
    const description = "This is a great idea!";
    
    let block = chain.mineBlock([
      Tx.contractCall('bright_mint', 'mint-idea', [
        types.utf8(title),
        types.utf8(description)
      ], deployer.address)
    ]);

    // Verify mint success
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Verify metadata
    let metadataBlock = chain.mineBlock([
      Tx.contractCall('bright_mint', 'get-token-metadata', [
        types.uint(1)
      ], deployer.address)
    ]);

    let metadata = metadataBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(metadata['title'], types.utf8(title));
    assertEquals(metadata['description'], types.utf8(description));
    assertEquals(metadata['creator'], deployer.address);
    assertEquals(metadata['likes'], types.uint(0));
    assertEquals(metadata['rewards-claimed'], types.uint(0));
  },
});

Clarinet.test({
  name: "Can transfer idea ownership",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First mint an idea
    let block = chain.mineBlock([
      Tx.contractCall('bright_mint', 'mint-idea', [
        types.utf8("Title"),
        types.utf8("Description")
      ], deployer.address),
      // Then transfer it
      Tx.contractCall('bright_mint', 'transfer-idea', [
        types.uint(1),
        types.principal(wallet1.address)
      ], deployer.address)
    ]);

    block.receipts[1].result.expectOk().expectBool(true);

    // Verify new owner
    let ownerBlock = chain.mineBlock([
      Tx.contractCall('bright_mint', 'get-token-owner', [
        types.uint(1)
      ], deployer.address)
    ]);

    ownerBlock.receipts[0].result.expectOk().expectSome().expectPrincipal(wallet1.address);
  },
});

Clarinet.test({
  name: "Can like and comment on an idea",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    let block = chain.mineBlock([
      Tx.contractCall('bright_mint', 'mint-idea', [
        types.utf8("Title"),
        types.utf8("Description")
      ], deployer.address),
      // Like the idea
      Tx.contractCall('bright_mint', 'like-idea', [
        types.uint(1)
      ], wallet1.address),
      // Comment on idea
      Tx.contractCall('bright_mint', 'add-comment', [
        types.uint(1),
        types.utf8("Great idea!")
      ], wallet1.address)
    ]);

    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);

    // Verify like count and comment
    let metadataBlock = chain.mineBlock([
      Tx.contractCall('bright_mint', 'get-token-metadata', [
        types.uint(1)
      ], deployer.address),
      Tx.contractCall('bright_mint', 'get-token-comments', [
        types.uint(1)
      ], deployer.address)
    ]);

    let metadata = metadataBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(metadata['likes'], types.uint(1));

    let comments = metadataBlock.receipts[1].result.expectOk().expectList();
    assertEquals(comments.length, 1);
    assertEquals(comments[0].author, wallet1.address);
    assertEquals(comments[0].text, types.utf8("Great idea!"));
  },
});

Clarinet.test({
  name: "Can claim rewards from likes",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall('bright_mint', 'mint-idea', [
        types.utf8("Title"),
        types.utf8("Description")
      ], deployer.address),
      // Add likes from different users
      Tx.contractCall('bright_mint', 'like-idea', [
        types.uint(1)
      ], wallet1.address),
      Tx.contractCall('bright_mint', 'like-idea', [
        types.uint(1)
      ], wallet2.address),
      // Claim rewards
      Tx.contractCall('bright_mint', 'claim-rewards', [
        types.uint(1)
      ], deployer.address)
    ]);

    // Verify reward claim
    block.receipts[3].result.expectOk().expectUint(2);

    // Verify updated metadata
    let metadataBlock = chain.mineBlock([
      Tx.contractCall('bright_mint', 'get-token-metadata', [
        types.uint(1)
      ], deployer.address)
    ]);

    let metadata = metadataBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(metadata['likes'], types.uint(2));
    assertEquals(metadata['rewards-claimed'], types.uint(2));
  },
});
