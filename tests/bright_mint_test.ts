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
  name: "Can like an idea",
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
      ], wallet1.address)
    ]);

    block.receipts[1].result.expectOk().expectBool(true);

    // Verify like count increased
    let metadataBlock = chain.mineBlock([
      Tx.contractCall('bright_mint', 'get-token-metadata', [
        types.uint(1)
      ], deployer.address)
    ]);

    let metadata = metadataBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(metadata['likes'], types.uint(1));
  },
});