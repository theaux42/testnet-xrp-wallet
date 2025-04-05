"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Client, Wallet } from "xrpl"

export default function AcceptNftOffer() {
  const [seed, setSeed] = useState("")
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchOffers = async () => {
    setLoading(true)
    setOffers([])
    try {
      const client = new Client("wss://s.altnet.rippletest.net:51233")
      await client.connect()

      const wallet = Wallet.fromSeed(seed)
      const res = await client.request({
        command: "account_nft_offers",
        account: wallet.classicAddress
      })

      const incoming = res.result.offers.filter(
        (offer) =>
          offer.amount === "0" && offer.destination === wallet.classicAddress
      )

      setOffers(incoming)
      await client.disconnect()
    } catch (err) {
      console.error("Erreur offre :", err)
    }
    setLoading(false)
  }

  const acceptOffer = async (offerId) => {
    try {
      const client = new Client("wss://s.altnet.rippletest.net:51233")
      await client.connect()

      const wallet = Wallet.fromSeed(seed)

      const tx = {
        TransactionType: "NFTokenAcceptOffer",
        Account: wallet.classicAddress,
        NFTokenOffer: offerId
      }

      const prepared = await client.autofill(tx)
      const signed = wallet.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)

      alert("✅ Offre acceptée ! TX : " + result.result.hash)
      await client.disconnect()
      fetchOffers()
    } catch (err) {
      console.error("❌ Erreur acceptation :", err)
    }
  }

  return (
    <div className="space-y-4 mt-10">
      <h2 className="text-xl font-bold">🎁 Accepter un NFT reçu</h2>
      <Input
        placeholder="Seed XRPL (commence par s...)"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
      />
      <Button onClick={fetchOffers} disabled={loading}>
        {loading ? "Chargement..." : "Voir les offres reçues"}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {offers.map((offer) => (
          <Card key={offer.nft_offer_index}>
            <CardContent className="p-4 space-y-2">
              <p><strong>Offre :</strong> {offer.nft_offer_index}</p>
              <p><strong>De :</strong> {offer.owner}</p>
              <Button onClick={() => acceptOffer(offer.nft_offer_index)}>
                Accepter le NFT
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
