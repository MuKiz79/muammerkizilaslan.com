(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  let bounds = null;
  function setBounds(next) {
    bounds = next;
  }
  // Camera space is shared by labels, suspension contours and their attachments.
  // The camera remains outside the bounded sculpture through unrestricted rotation.
  function rotate(p, yaw, pitch) {
    const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
      z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
    return {
      x,
      y: p.y * Math.cos(pitch) - z * Math.sin(pitch),
      z: p.y * Math.sin(pitch) + z * Math.cos(pitch),
    };
  }
  function position(index, time, count = 24) {
    const slot = (index * 7) % count,
      latitude = 1 - (2 * (slot + 0.5)) / count;
    const phase = slot * 2.399963229728653,
      timeScale = 0.023 + (index % 5) * 0.004;
    const angle = phase + time * timeScale * (index % 3 === 1 ? -1 : 1);
    const y = latitude * 0.87 + Math.sin(time * 0.16 + phase) * 0.055;
    const radius = 0.84 + (index % 4) * 0.046;
    const ring = Math.sqrt(Math.max(0, 1 - y * y)) * radius;
    return rotate(
      { x: Math.cos(angle) * ring, y: y * radius, z: Math.sin(angle) * ring },
      0.3,
      Math.sin(time * 0.07 + index) * 0.065,
    );
  }
  function contour(group, angle, time) {
    const r = 0.94 + group * 0.04;
    const p = {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * 0.72,
      z: Math.sin(angle) * r * 0.24,
    };
    return rotate(
      p,
      [-0.4, 0.95, -0.85][group] + Math.sin(time * 0.06 + group) * 0.08,
      [-0.45, 0.55, 1.1][group],
    );
  }
  function frame(width, height, small) {
    if (bounds) {
      const { left, right, top, bottom } = bounds;
      return {
        cx: (left + right) / 2,
        cy: (top + bottom) / 2,
        rx: (right - left) * 0.43,
        ry: Math.max(40, (bottom - top) * 0.43),
        left,
        right,
        top,
        bottom,
      };
    }
    return {
      cx: width * 0.5,
      cy: height / 2 - (small ? 30 : 0),
      rx: width * (small ? 0.4 : 0.38),
      ry: Math.max(80, (height - (small ? 320 : 245)) * 0.43),
      left: 12,
      right: width - 12,
      top: small ? 160 : 115,
      bottom: height - (small ? 180 : 115),
    };
  }
  function project(p, width, height, small) {
    const perspective = 3.8 / (3.8 - p.z),
      f = frame(width, height, small);
    return {
      x: f.cx + p.x * f.rx * perspective,
      y: f.cy + p.y * f.ry * perspective,
      z: p.z,
      perspective,
      scale: Math.pow(perspective, small ? 0.9 : 1.22),
    };
  }
  const api = { rotate, position, contour, project, frame, setBounds, TAU };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KineticSpace = api;
})(typeof window !== 'undefined' ? window : this);
