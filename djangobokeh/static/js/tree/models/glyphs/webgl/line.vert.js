"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vertex_shader = "\nprecision mediump float;\n\nconst float PI = 3.14159265358979323846264;\nconst float THETA = 15.0 * 3.14159265358979323846264/180.0;\n\nuniform float u_pixel_ratio;\nuniform vec2 u_canvas_size, u_offset;\nuniform vec2 u_scale_aspect;\nuniform float u_scale_length;\n\nuniform vec4 u_color;\nuniform float u_antialias;\nuniform float u_length;\nuniform float u_linewidth;\nuniform float u_dash_index;\nuniform float u_closed;\n\nattribute vec2 a_position;\nattribute vec4 a_tangents;\nattribute vec2 a_segment;\nattribute vec2 a_angles;\nattribute vec2 a_texcoord;\n\nvarying vec4  v_color;\nvarying vec2  v_segment;\nvarying vec2  v_angles;\nvarying vec2  v_texcoord;\nvarying vec2  v_miter;\nvarying float v_length;\nvarying float v_linewidth;\n\nfloat cross(in vec2 v1, in vec2 v2)\n{\n    return v1.x*v2.y - v1.y*v2.x;\n}\n\nfloat signed_distance(in vec2 v1, in vec2 v2, in vec2 v3)\n{\n    return cross(v2-v1,v1-v3) / length(v2-v1);\n}\n\nvoid rotate( in vec2 v, in float alpha, out vec2 result )\n{\n    float c = cos(alpha);\n    float s = sin(alpha);\n    result = vec2( c*v.x - s*v.y,\n                   s*v.x + c*v.y );\n}\n\nvoid main()\n{\n    bool closed = (u_closed > 0.0);\n\n    // Attributes and uniforms to varyings\n    v_color = u_color;\n    v_linewidth = u_linewidth;\n    v_segment = a_segment * u_scale_length;\n    v_length = u_length * u_scale_length;\n\n    // Scale to map to pixel coordinates. The original algorithm from the paper\n    // assumed isotropic scale. We obviously do not have this.\n    vec2 abs_scale_aspect = abs(u_scale_aspect);\n    vec2 abs_scale = u_scale_length * abs_scale_aspect;\n\n    // Correct angles for aspect ratio\n    vec2 av;\n    av = vec2(1.0, tan(a_angles.x)) / abs_scale_aspect;\n    v_angles.x = atan(av.y, av.x);\n    av = vec2(1.0, tan(a_angles.y)) / abs_scale_aspect;\n    v_angles.y = atan(av.y, av.x);\n\n    // Thickness below 1 pixel are represented using a 1 pixel thickness\n    // and a modified alpha\n    v_color.a = min(v_linewidth, v_color.a);\n    v_linewidth = max(v_linewidth, 1.0);\n\n    // If color is fully transparent we just will discard the fragment anyway\n    if( v_color.a <= 0.0 ) {\n        gl_Position = vec4(0.0,0.0,0.0,1.0);\n        return;\n    }\n\n    // This is the actual half width of the line\n    float w = ceil(u_antialias+v_linewidth)/2.0;\n\n    vec2 position = (a_position + u_offset) * abs_scale;\n\n    vec2 t1 = normalize(a_tangents.xy * abs_scale_aspect);  // note the scaling for aspect ratio here\n    vec2 t2 = normalize(a_tangents.zw * abs_scale_aspect);\n    float u = a_texcoord.x;\n    float v = a_texcoord.y;\n    vec2 o1 = vec2( +t1.y, -t1.x);\n    vec2 o2 = vec2( +t2.y, -t2.x);\n\n    // This is a join\n    // ----------------------------------------------------------------\n    if( t1 != t2 ) {\n        float angle = atan (t1.x*t2.y-t1.y*t2.x, t1.x*t2.x+t1.y*t2.y);  // Angle needs recalculation for some reason\n        vec2 t  = normalize(t1+t2);\n        vec2 o  = vec2( + t.y, - t.x);\n\n        if ( u_dash_index > 0.0 )\n        {\n            // Broken angle\n            // ----------------------------------------------------------------\n            if( (abs(angle) > THETA) ) {\n                position += v * w * o / cos(angle/2.0);\n                float s = sign(angle);\n                if( angle < 0.0 ) {\n                    if( u == +1.0 ) {\n                        u = v_segment.y + v * w * tan(angle/2.0);\n                        if( v == 1.0 ) {\n                            position -= 2.0 * w * t1 / sin(angle);\n                            u -= 2.0 * w / sin(angle);\n                        }\n                    } else {\n                        u = v_segment.x - v * w * tan(angle/2.0);\n                        if( v == 1.0 ) {\n                            position += 2.0 * w * t2 / sin(angle);\n                            u += 2.0*w / sin(angle);\n                        }\n                    }\n                } else {\n                    if( u == +1.0 ) {\n                        u = v_segment.y + v * w * tan(angle/2.0);\n                        if( v == -1.0 ) {\n                            position += 2.0 * w * t1 / sin(angle);\n                            u += 2.0 * w / sin(angle);\n                        }\n                    } else {\n                        u = v_segment.x - v * w * tan(angle/2.0);\n                        if( v == -1.0 ) {\n                            position -= 2.0 * w * t2 / sin(angle);\n                            u -= 2.0*w / sin(angle);\n                        }\n                    }\n                }\n                // Continuous angle\n                // ------------------------------------------------------------\n            } else {\n                position += v * w * o / cos(angle/2.0);\n                if( u == +1.0 ) u = v_segment.y;\n                else            u = v_segment.x;\n            }\n        }\n\n        // Solid line\n        // --------------------------------------------------------------------\n        else\n        {\n            position.xy += v * w * o / cos(angle/2.0);\n            if( angle < 0.0 ) {\n                if( u == +1.0 ) {\n                    u = v_segment.y + v * w * tan(angle/2.0);\n                } else {\n                    u = v_segment.x - v * w * tan(angle/2.0);\n                }\n            } else {\n                if( u == +1.0 ) {\n                    u = v_segment.y + v * w * tan(angle/2.0);\n                } else {\n                    u = v_segment.x - v * w * tan(angle/2.0);\n                }\n            }\n        }\n\n    // This is a line start or end (t1 == t2)\n    // ------------------------------------------------------------------------\n    } else {\n        position += v * w * o1;\n        if( u == -1.0 ) {\n            u = v_segment.x - w;\n            position -= w * t1;\n        } else {\n            u = v_segment.y + w;\n            position += w * t2;\n        }\n    }\n\n    // Miter distance\n    // ------------------------------------------------------------------------\n    vec2 t;\n    vec2 curr = a_position * abs_scale;\n    if( a_texcoord.x < 0.0 ) {\n        vec2 next = curr + t2*(v_segment.y-v_segment.x);\n\n        rotate( t1, +v_angles.x/2.0, t);\n        v_miter.x = signed_distance(curr, curr+t, position);\n\n        rotate( t2, +v_angles.y/2.0, t);\n        v_miter.y = signed_distance(next, next+t, position);\n    } else {\n        vec2 prev = curr - t1*(v_segment.y-v_segment.x);\n\n        rotate( t1, -v_angles.x/2.0,t);\n        v_miter.x = signed_distance(prev, prev+t, position);\n\n        rotate( t2, -v_angles.y/2.0,t);\n        v_miter.y = signed_distance(curr, curr+t, position);\n    }\n\n    if (!closed && v_segment.x <= 0.0) {\n        v_miter.x = 1e10;\n    }\n    if (!closed && v_segment.y >= v_length)\n    {\n        v_miter.y = 1e10;\n    }\n\n    v_texcoord = vec2( u, v*w );\n\n    // Calculate position in device coordinates. Note that we\n    // already scaled with abs scale above.\n    vec2 normpos = position * sign(u_scale_aspect);\n    normpos += 0.5;  // make up for Bokeh's offset\n    normpos /= u_canvas_size / u_pixel_ratio;  // in 0..1\n    gl_Position = vec4(normpos*2.0-1.0, 0.0, 1.0);\n    gl_Position.y *= -1.0;\n}\n";
