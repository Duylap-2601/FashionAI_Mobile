import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS } from '@/constants/theme';

interface BodyDiagramProps {
  values: Record<string, string | number>;
  gender?: 'female' | 'male' | 'other';
}

const KEY_FIELDS = ['height', 'weight', 'shoulder', 'chest', 'waist', 'hip', 'inseam'];

// Hình minh họa kiểu FE body-diagram.tsx: thân ivory viền brass, đường đo taupe,
// vòng eo oxblood mờ; chấm đo đổi màu khi trường tương ứng đã có giá trị.
const FIGURE_FILL = COLORS.ivory;
const FIGURE_STROKE = COLORS.brass;
const GUIDE_STROKE = COLORS.taupe;
const WAIST_STROKE = COLORS.oxblood;

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
    <View className="w-full items-center">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="relative h-[380px] w-[180px] items-center justify-center"
      >
        <Svg
          width={180}
          height={380}
          viewBox="0 0 200 420"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <G>
            {/* Head */}
            <Path
              d="M100 20 C114 20 124 31 124 47 C124 65 114 78 100 78 C86 78 76 65 76 47 C76 31 86 20 100 20 Z"
              fill={FIGURE_FILL}
              stroke={FIGURE_STROKE}
              strokeWidth="1.5"
            />
            {/* Chin curve */}
            <Path d="M90 77 C92 86 108 86 110 77" stroke={FIGURE_STROKE} strokeWidth="1.5" />

            {/* Torso & Limbs */}
            {isFemale ? (
              <Path
                d="M83 86 C70 91 62 103 58 121 C53 145 48 181 42 219 C41 226 47 231 54 229 L66 225 C72 190 76 156 80 128 C82 116 86 109 94 107 L100 108 L106 107 C114 109 118 116 120 128 C124 156 128 190 134 225 L146 229 C153 231 159 226 158 219 C152 181 147 145 142 121 C138 103 130 91 117 86 C113 101 111 115 115 130 C119 145 126 166 127 190 C128 211 117 229 113 247 C110 261 113 280 119 305 L130 379 C131 386 126 392 119 392 L107 392 C102 348 99 310 100 277 C101 310 98 348 93 392 L81 392 C74 392 69 386 70 379 L81 305 C87 280 90 261 87 247 C83 229 72 211 73 190 C74 166 81 145 85 130 C89 115 87 101 83 86 Z"
                fill={FIGURE_FILL}
                stroke={FIGURE_STROKE}
                strokeWidth="1.5"
              />
            ) : (
              <Path
                d="M82 86 C68 91 58 104 55 123 C51 151 47 181 40 219 C39 226 45 232 52 230 L64 227 C70 194 73 160 78 129 C80 116 85 109 94 107 L100 108 L106 107 C115 109 120 116 122 129 C127 160 130 194 136 227 L148 230 C155 232 161 226 160 219 C153 181 149 151 145 123 C142 104 132 91 118 86 C113 103 111 123 115 144 L121 204 C123 223 118 237 114 252 C111 266 114 290 120 320 L129 379 C130 386 125 392 118 392 L106 392 L100 285 L94 392 L82 392 C75 392 70 386 71 379 L80 320 C86 290 89 266 86 252 C82 237 77 223 79 204 L85 144 C89 123 87 103 82 86 Z"
                fill={FIGURE_FILL}
                stroke={FIGURE_STROKE}
                strokeWidth="1.5"
              />
            )}
          </G>

          {/* Guidelines */}
          <Path d="M100 88 L100 252" stroke={GUIDE_STROKE} strokeWidth="1" strokeDasharray="4,4" />
          <Path
            d="M69 189 C88 194 112 194 131 189"
            stroke={WAIST_STROKE}
            strokeWidth="1.2"
            strokeDasharray="4,4"
            strokeOpacity={0.5}
          />
          <Path d="M77 128 C91 133 109 133 123 128" stroke={GUIDE_STROKE} strokeWidth="1" strokeDasharray="3,4" />
          <Path d="M79 247 C92 252 108 252 121 247" stroke={GUIDE_STROKE} strokeWidth="1" strokeDasharray="3,4" />
        </Svg>

        {/* Measurement Points: vị trí dọc tính theo hình 380px. */}
        {filledPoints.map((point) => {
          const filled = !!values[point.id] && Number(values[point.id]) > 0;
          return (
            <View
              key={point.id}
              className="absolute right-0 flex-row items-center gap-1.5 pr-2"
              style={{ top: point.top }}
            >
              <Text
                className={`font-sans text-[11px] font-medium ${
                  filled ? 'text-oxblood' : 'text-landing-muted'
                }`}
              >
                {point.label}
              </Text>
              <View
                className={`h-2.5 w-2.5 rounded-full border-2 border-landing-paper ${
                  filled ? 'bg-oxblood' : 'bg-taupe'
                }`}
              />
            </View>
          );
        })}
      </View>

      {/* Completion Bar */}
      <View
        accessible
        accessibilityLabel={`Độ hoàn thiện ${pct}%, ${filledCount} trên ${KEY_FIELDS.length} số đo cơ bản`}
        className="mt-4 w-full px-4"
      >
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text className="font-sans text-[12px] text-landing-muted">Độ hoàn thiện</Text>
          <Text className="font-mono text-[12px] font-semibold text-oxblood">{pct}%</Text>
        </View>
        <View className="h-1 w-full overflow-hidden bg-taupe/40">
          {/* Bề rộng thanh tính theo % số đo đã nhập. */}
          <View className="h-full bg-oxblood" style={{ width: `${pct}%` }} />
        </View>
        <Text className="mt-2 text-center font-sans text-[11.5px] text-landing-muted">
          <Text className="font-mono">
            {filledCount}/{KEY_FIELDS.length}
          </Text>{' '}
          số đo cơ bản
        </Text>
      </View>
    </View>
  );
};

export const BodyDiagram = React.memo(BodyDiagramComponent, (prev, next) => {
  if (prev.gender !== next.gender) return false;
  const allDiagramFields = ['height', 'weight', 'shoulder', 'chest', 'waist', 'hip', 'inseam', 'neck', 'thigh'];
  return allDiagramFields.every((k) => {
    const prevFilled = !!prev.values?.[k] && Number(prev.values[k]) > 0;
    const nextFilled = !!next.values?.[k] && Number(next.values[k]) > 0;
    return prevFilled === nextFilled;
  });
});
