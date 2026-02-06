import React, { useState } from 'react';

export default function TailwindTest() {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonCount, setButtonCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
          🎨 Tailwind CSS Test Page
        </h1>
        <p className="text-xl text-white/90">
          Testing Tailwind CSS Classes - Colors, Animations & Effects
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto">

        {/* Color Palette Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-red-500 hover:bg-red-600 transition-all duration-300 transform hover:scale-105 rounded-xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Red Card</h3>
            <p className="text-red-100">Hover me to see animation!</p>
          </div>

          <div className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 rounded-xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Blue Card</h3>
            <p className="text-blue-100">Smooth transitions!</p>
          </div>

          <div className="bg-green-500 hover:bg-green-600 transition-all duration-300 transform hover:scale-105 rounded-xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Green Card</h3>
            <p className="text-green-100">Scale on hover!</p>
          </div>

          <div className="bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 rounded-xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Yellow Card</h3>
            <p className="text-yellow-100">Beautiful shadows!</p>
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Interactive Elements</h3>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              onClick={() => setButtonCount(buttonCount + 1)}
            >
              Click Me! ({buttonCount})
            </button>

            <button
              className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered ? '🎉 Hovered!' : 'Hover Me!'}
            </button>

            <button className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg">
              Animated Button
            </button>
          </div>
        </div>

        {/* Typography Test */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-2xl">
          <h3 className="text-4xl font-bold text-gray-800 mb-6">Typography Test</h3>

          <div className="space-y-4">
            <h1 className="text-5xl font-black text-purple-600">Heading 1 - Black</h1>
            <h3 className="text-4xl font-bold text-blue-600">Heading 2 - Bold</h3>
            <h3 className="text-3xl font-semibold text-green-600">Heading 3 - Semibold</h3>
            <h4 className="text-2xl font-medium text-orange-600">Heading 4 - Medium</h4>
            <p className="text-lg text-gray-700 leading-relaxed">
              This is a paragraph with <span className="text-red-500 font-bold">colored text</span> and
              <span className="bg-yellow-200 px-2 py-1 rounded">highlighted text</span> to test various typography styles.
            </p>
          </div>
        </div>

        {/* Grid Layout Test */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Grid Layout Test</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center text-white hover:bg-white/40 transition-all duration-300"
              >
                <div className="text-2xl font-bold mb-2">Item {item}</div>
                <div className="text-sm opacity-80">Grid responsive item</div>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Test */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Animation Test</h3>

          <div className="flex justify-center items-center space-x-8">
            <div className="w-16 h-16 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 bg-green-500 rounded-full animate-ping"></div>
            <div className="w-16 h-16 bg-yellow-500 rounded-full animate-spin"></div>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Bounce • Pulse • Ping • Spin animations
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-full shadow-lg">
            <div className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse"></div>
            <span className="font-semibold">Tailwind CSS is Working! 🎉</span>
          </div>
        </div>
      </div>
    </div>
  );
}