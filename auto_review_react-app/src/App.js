"use client";

import React from 'react';
import { Card, CardContent } from "./components/ui/card.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { Textarea } from "./components/ui/textarea.js";
import { Heart, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DriveReview() {
  return (
    <div className="MainDiv">
      <header>
      <h1 className="Title">Dzienny generator recenzji filmów z AI</h1>
        <nav className="NavBar">
          <a href="#" className="hover:underline">Filmy</a>
          <a href="#" className="hover:underline">Top</a>
          <a href="#" className="hover:underline">Moje recenzje</a>
        </nav>
      </header>
      <div className="GenerateDiv">
        <section className="GenerateSection">
          <h2 className="text-2xl font-semibold mb-4">AI recenzje filmów</h2>
          <Button className="text-lg px-6 py-2 bg-purple-600 hover:bg-purple-700 transition-colors duration-300">Wygeneruj</Button>
        </section>
      </div>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="ImgDiv">
          <img
            src="/21c9ee7c-547f-492a-9c7b-a086e8bcfe73.png"
            alt="Drive Movie Poster"
            width={400}
            height={600}
            className="rounded-2xl shadow-md"
          />
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">Car action</span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">One-Person Army Action</span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">Action</span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm">Drama</span>
            </div>
            <p className="mt-2">Tajemniczy kaskader z hollywoodzkiego kina akcji wpada w kłopoty z gangsterami, gdy próbuje pomóc mężowi swojej sąsiadki obrabować lombard, służąc mu za kierowcę.</p>
            <p><strong>Director:</strong> Nicolas Winding Refn</p>
            <p><strong>Writers:</strong> Hossein Amini | James Sallis</p>
            <p><strong>Stars:</strong> Ryan Gosling | Carey Mulligan | Bryan Cranston</p>
          </div>
        </div>

        <div className="ReviewDiv">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardContent className="p-6 text-gray-800 bg-white rounded-2xl shadow-md">
                <h3 className="text-xl font-semibold mb-4">Recenzja:</h3>
                <p className="space-y-4">
                  Film "Drive" to dynamiczny thriller, który wciąga widza od pierwszej do ostatniej minuty. Fabuła skupia się na tajemniczym kierowcy (Ryan Gosling), który za dnia pracuje jako kaskader filmowy, a nocą jako kierowca do wynajęcia dla przestępców. Jego życie zmienia się, gdy poznaje sąsiadkę Irene (Carey Mulligan) i jej syna, co prowadzi do serii nieprzewidywalnych wydarzeń.<br /><br />

                  Gra aktorska w "Drive" zasługuje na szczególne uznanie. Ryan Gosling w roli głównej jest magnetyczny i pełen charyzmy, a jego minimalistyczny styl gry dodaje postaci głębi. Carey Mulligan w roli Irene wnosi do filmu ciepło i delikatność, tworząc kontrast z brutalnym światem przestępczym. Warto również wspomnieć o doskonałych rolach drugoplanowych, takich jak Bryan Cranston i Albert Brooks, którzy dodają filmowi dodatkowego wymiaru.<br /><br />

                  Reżyseria Nicolasa Windinga Refna jest mistrzowska. Jego umiejętność budowania napięcia i tworzenia niezapomnianych scen akcji sprawia, że "Drive" wyróżnia się na tle innych filmów tego gatunku. Refn doskonale balansuje między spokojnymi, introspektywnymi momentami a dynamicznymi sekwencjami akcji, co sprawia, że film jest zarówno emocjonujący, jak i głęboki.<br /><br />

                  Podsumowując, "Drive" to film, który warto zobaczyć. Jego unikalny styl, świetna gra aktorska i reżyseria sprawiają, że jest to jeden z najlepszych thrillerów ostatnich lat.<br />
                  <strong>Ocena: 8/10</strong>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="mt-6">
            <Textarea placeholder="Napisz komentarz..." className="w-full h-24 p-4 rounded-lg shadow-sm" />
            <div className="flex gap-4 mt-3">
              <ThumbsUp className="text-gray-600 hover:text-black cursor-pointer" />
              <Heart className="text-gray-600 hover:text-red-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
