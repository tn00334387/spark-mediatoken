const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const _ = require("lodash");
describe("Spark", async () => {
  console.log(`Spark Test`)
 
  let Spark, owner, user1, user2, user3, sparkDes;
  const provider = ethers.provider


    beforeEach(async () => {
      
      try {

        const [ o, u1, u2, u3 ] = await ethers.getSigners()
        owner = o
        user1 = u1
        user2 = u2
        user3 = u3
        sparkDes = ethers.Wallet.createRandom().connect(provider)
        Spark = await ethers.deployContract("SparkDev", [owner.address])
        await Spark.waitForDeployment()
        await Spark.connect(owner).setProtocolDestination(sparkDes.address)
        await Spark.connect(owner).setTokenShareFee(ethers.parseUnits(`0.1`))
        await Spark.connect(owner).setAdminList(owner.address)

      } catch (error) {
        console.log(error)
      }
    });

    describe("Checking Deployment", async () => {

      it("should set the right data", async () => {
        expect(Spark.runner.address).to.equal(owner.address);
        expect(await Spark.protocolDestination()).to.equal(sparkDes.address)
        expect(Number(ethers.formatUnits(await Spark.tokenShareFee()))).to.equal(0.1)
        expect(Number(await Spark.maxMintSupply())).to.equal(1000)
        expect(await Spark.adminList(owner.address)).to.equal(true)
        expect(await Spark.adminList(sparkDes.address)).to.equal(false)
      });

    });

    describe("Deploy", async () => {

      const mediaId1 = ethers.encodeBytes32String(`Twitter|1752160949094818183`)
      const tokenUrl1 = `ipfs://QmVf3m9BeLpBiEE2DKZFAN3AxuUaDekc6R3c21uEvwaGvW`
      
      it("should deploy one media succeed", async () => {
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
          const tokenInfo = await Spark.mediaTokens(mediaId1)
          expect(tokenInfo[0]).to.equal(user1.address)
      });

      it("should failed to deploy duplicate media", async () => {
        try {
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
          await Spark.connect(owner).deploy(user2.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
        } catch (error) {
          checkErrorMes(error, "The mediaId has been deployed")
        }
      });

      it("should failed to deploy media not admin", async () => {
        try {
          await Spark.connect(user1).deploy(user1.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
        } catch (error) {
          checkErrorMes(error, "Permission denied")
        }
      });

    });

    describe("Mint", async () => {


      console.log(ethers.encodeBytes32String(`Twitter|1754974835602862187`))
      console.log(ethers.encodeBytes32String(`Twitter|1752160949094818183`))
      console.log(ethers.encodeBytes32String(`Twitter|1760592443450204411`))
      console.log(ethers.encodeBytes32String(`Twitter|1704608186723119329`))
      console.log(ethers.encodeBytes32String(`Twitter|1110302988`))
      console.log(ethers.encodeBytes32String(`Twitter|1757090609855398300`))

      const mediaId1 = ethers.encodeBytes32String(`Twitter|1752160949094818183`)
      const tokenUrl1 = `ipfs://QmVf3m9BeLpBiEE2DKZFAN3AxuUaDekc6R3c21uEvwaGvW`

      const mediaId2 = ethers.encodeBytes32String(`Twitter|1722771075426378094`)
      const tokenUrl2 = `ipfs://Qme8G4R6kHeLYdibn9hFSx7VLbXoNbce3SHJbxpkzpL8C1`

      const mediaId3 = ethers.encodeBytes32String(`Twitter|1726747087906464024`)
      const tokenUrl3 = `ipfs://QmYmzcia6boWSL6fcwXysHGdd3MLQscBgsgJC61JrcvBK2`

      it("should mint one media token succeed", async () => {
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
          await Spark.connect(user2).mint(mediaId1, 1, { value: ethers.parseEther(`0.003`) })
          const tokenInfo = await Spark.mediaTokens(mediaId1)
          const tokenId = Number(tokenInfo[1])
          expect(await Spark.balanceOf(user2.address, tokenId)).to.equal(1)
      });

      it("should mint multi media token succeed", async () => {
        const tokenMintPrice = ethers.parseEther(`0.003`)
        await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, tokenMintPrice)
        const tokenInfo1 = await Spark.mediaTokens(mediaId1)
        const tokenId = Number(tokenInfo1[1])
        const tokenPrice = Number(ethers.formatUnits(tokenInfo1[3]))
        const tokenSupply1 = Number(tokenInfo1[2])
        const mintAmount = 5
        await Spark.connect(user2).mint(mediaId1, mintAmount, { value: ethers.parseEther(`${tokenPrice * mintAmount}`) })
        const tokenInfo2 = await Spark.mediaTokens(mediaId1)
        const tokenSupply2 = Number(tokenInfo2[2])
        expect(await Spark.balanceOf(user2.address, tokenId)).to.equal(mintAmount)
        expect(tokenSupply2 - tokenSupply1).to.equal(5)
      });

      it("should failed to mint media without deployed", async () => {
        try {
          await Spark.connect(user1).mint(mediaId1, 1, { value: ethers.parseEther(`0.003`) })
        } catch (error) {
          checkErrorMes(error, "The mediaId has not been deployed")
        }
      });

      it("should failed to mint one media token insufficient payment", async () => {
        try {
          const tokenMintPrice = ethers.parseEther(`0.003`)
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, tokenMintPrice)
          await Spark.connect(user2).mint(mediaId1, 1, { value: ethers.parseEther(`0.002`) })
        } catch (error) {
          checkErrorMes(error, "Insufficient funds")
        }
      });

      it("should failed to mint mulit media token insufficient payment", async () => {
        try {
          const tokenMintPrice = ethers.parseEther(`0.003`)
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, tokenMintPrice)
          const tokenInfo = await Spark.mediaTokens(mediaId1)
          const tokenPrice = Number(ethers.formatUnits(tokenInfo[3]))
          await Spark.connect(user2).mint(mediaId1, 5, { value: ethers.parseEther(`${tokenPrice}`) })
        } catch (error) {
          checkErrorMes(error, "Insufficient funds")
        }
      });

      it("should failed to mint token supply exceeded", async () => {
        try {
          await Spark.connect(owner).setMaxMintSupply(3)
          await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, ethers.parseEther(`0.003`))
          await Spark.connect(user1).mint(mediaId1, 1, { value: ethers.parseEther(`0.003`) })
          await Spark.connect(user2).mint(mediaId1, 1, { value: ethers.parseEther(`0.003`) })
          await Spark.connect(user3).mint(mediaId1, 1, { value: ethers.parseEther(`0.003`) })
        } catch (error) {
          checkErrorMes(error, "Max media token supply exceeded")
        }
      });

      it("should mint one token supply by admin succeed", async () => {
        const tokenMintPrice = ethers.parseEther(`0.003`)
        const mintAmount = 3
        await Spark.connect(owner).deploy(user1.address, mediaId1, tokenUrl1, tokenMintPrice)
        await Spark.connect(owner).mintByAdmin(user2.address, mediaId1, mintAmount)
        const tokenInfo = await Spark.mediaTokens(mediaId1)
        const tokenId = Number(tokenInfo[1])
        expect(await Spark.balanceOf(user2.address, tokenId)).to.equal(mintAmount)
      });

    });

    console.log("Done !")

  });

function checkErrorMes( error, errMes = "" ){
  const message = JSON.stringify(error);
  assert(message.indexOf(errMes) !== -1);
}

function ethToHex( ethAmount = 0 ){
  const ethBigInt = ethers.parseEther(`${ethAmount}`)
  return `0x${ethBigInt.toString(16)}`;
}

function toNumber( value ){
  return Number(Number(ethers.formatUnits(value)).toFixed(10))
}