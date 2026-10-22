import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface BodyDiagramProps {
  values: Record<string, string | number>;
  gender?: 'female' | 'male' | 'other';
}

const KEY_FIELDS = ['height', 'weight', 'shoulder', 'chest', 'waist', 'hip', 'inseam'];

const BodyDiagramComponent: React.FC<BodyDiagramProps> = ({ values, gender = 'female' }) => {
  const isFemale = gender !== 'male';

  const filledPoints = [
    { id: 'neck', label: 'Cổ', top: 50 },
    { id: 'shoulder', label: 'Vai', top: 85 },
    { id: 'chest', label: 'Ngực', top: 120 },
    { id: 'waist', label: 'Eo', top: 172 },
    { id: 'hip', label: 'Hông', top: 210 },
    { id: 'thigh', label: 'Đùi', top: 242 },
  ];

  const filledCount = KEY_FIELDS.filter((k) => !!values[k] && Number(values[k]) > 0).length;
  const pct = Math.round((filledCount / KEY_FIELDS.length) * 100);

  return (
    <View className="items-center w-full">
      <View className="relative w-[180px] h-[380px] items-center justify-center">
        <Svg width={180} height={380} viewBox="0 0 200 420" fill="none">
          <Defs>
            <LinearGradient id="bodyDiagramSkin" x1="55" y1="18" x2="146" y2="390" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#F8FAFF" />
              <Stop offset="1" stopColor="#E8EDFF" />
            </LinearGradient>
          </Defs>

          <G>
            {/* Head */}
            <Path
              d="M100 20 C114 20 124 31 124 47 C124 65 114 78 100 78 C86 78 76 65 76 47 C76 31 86 20 100 20 Z"
              fill="url(#bodyDiagramSkin)"
              stroke="#8EA2FF"
              strokeWidth="2"
            />
            {/* Chin curve */}
            <Path d="M90 77 C92 86 108 86 110 77" stroke="#8EA2FF" strokeWidth="2" />

            {/* Torso & Limbs */}
            {isFemale ? (
              <Path
                d="M83 86 C70 91 62 103 58 121 C53 145 48 181 42 219 C41 226 47 231 54 229 L66 225 C72 190 76 156 80 128 C82 116 86 109 94 107 L100 108 L106 107 C114 109 118 116 120 128 C124 156 128 190 134 225 L146 229 C153 231 159 226 158 219 C152 181 147 145 142 121 C138 103 130 91 117 86 C113 101 111 115 115 130 C119 145 126 166 127 190 C128 211 117 229 113 247 C110 261 113 280 119 305 L130 379 C131 386 126 392 119 392 L107 392 C102 348 99 310 100 277 C101 310 98 348 93 392 L81 392 C74 392 69 386 70 379 L81 305 C87 280 90 261 87 247 C83 229 72 211 73 190 C74 166 81 145 85 130 C89 115 87 101 83 86 Z"
                fill="url(#bodyDiagramSkin)"
                stroke="#8EA2FF"
                strokeWidth="2"
              />
            ) : (
              <Path
                d="M82 86 C68 91 58 104 55 123 C51 151 47 181 40 219 C39 226 45 232 52 230 L64 227 C70 194 73 160 78 129 C80 116 85 109 94 107 L100 108 L106 107 C115 109 120 116 122 129 C127 160 130 194 136 227 L148 230 C155 232 161 226 160 219 C153 181 149 151 145 123 C142 104 132 91 118 86 C113 103 111 123 115 144 L121 204 C123 223 118 237 114 252 C111 266 114 290 120 320 L129 379 C130 386 125 392 118 392 L106 392 L100 285 L94 392 L82 392 C75 392 70 386 71 379 L80 320 C86 290 89 266 86 252 C82 237 77 223 79 204 L85 144 C89 123 87 103 82 86 Z"
                fill="url(#bodyDiagramSkin)"
                stroke="#8EA2FF"
                strokeWidth="2"
              />
            )}
          </G>

          {/* Guidelines */}
          <Path d="M100 88 L100 252" stroke="#CBD5FF" strokeWidth="1.2" strokeDasharray="4,4" opacity="0.85" />
          <Path d="M69 189 C88 194 112 194 131 189" stroke="#FCD34D" strokeWidth="1.7" strokeDasharray="4,4" opacity="0.72" />
          <Path d="M77 128 C91 133 109 133 123 128" stroke="#CBD5FF" strokeWidth="1.1" strokeDasharray="3,4" opacity="0.65" />
          <Path d="M79 247 C92 252 108 252 121 247" stroke="#CBD5FF" strokeWidth="1.1" strokeDasharray="3,4" opacity="0.65" />
        </Svg>

        {/* Measurement Points */}
        {filledPoints.map((point) => {
          const filled = !!values[point.id] && Number(values[point.id]) > 0;
          return (
            <View
              key={point.id}
              className="absolute right-0 flex-row items-center gap-1.5 pr-2"
              style={{ top: point.top }}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  filled ? 'text-[#5D1C34]' : 'text-[#9CA3AF]'
                }`}
              >
                {point.label}
              </Text>
              <View
                className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                  filled ? 'bg-[#5D1C34]' : 'bg-[#D1D5DB]'
                }`}
              />
            </View>
          );
        })}
      </View>

      {/* Completion Bar */}
      <View className="w-full mt-4 px-4">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[12px] text-[#6B7280]">Độ hoàn thiện</Text>
          <Text className="text-[12px] font-bold text-[#5D1C34]">{pct}%</Text>
        </View>
        <View className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
          <View
            className="h-full bg-[#5D1C34] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
        <Text className="text-[11.5px] text-[#9CA3AF] mt-2 text-center">
          {filledCount}/{KEY_FIELDS.length} số đo cơ bản
        </Text>
      </View>
    </View>
  );
};

export const BodyDiagram = React.memo(BodyDiagramComponent, (prev, next) => {
  if (prev.gender !== next.gender) return false;
  return KEY_FIELDS.every((k) => prev.values[k] === next.values[k]);
});
