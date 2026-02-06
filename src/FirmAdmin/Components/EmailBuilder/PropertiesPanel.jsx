import React, { useState, useRef } from 'react';
import { firmAdminEmailTemplatesAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import './PropertiesPanel.css';

const PropertiesPanel = ({ block, firmData, brandingData, onUpdate, onClose }) => {
    if (!block) return null;

    const renderProperties = () => {
        switch (block.type) {
            case 'text':
                return <TextProperties data={block.data} onChange={onUpdate} />;
            case 'heading':
                return <HeadingProperties data={block.data} onChange={onUpdate} />;
            case 'button':
                return <ButtonProperties data={block.data} onChange={onUpdate} brandingData={brandingData} />;
            case 'image':
                return <ImageProperties data={block.data} onChange={onUpdate} />;
            case 'logo':
                return <LogoProperties data={block.data} onChange={onUpdate} firmData={firmData} />;
            case 'divider':
                return <DividerProperties data={block.data} onChange={onUpdate} />;
            case 'social':
                return <SocialProperties data={block.data} onChange={onUpdate} />;
            case 'signature':
                return <SignatureProperties data={block.data} onChange={onUpdate} firmData={firmData} />;
            case 'menu':
                return <MenuProperties data={block.data} onChange={onUpdate} />;
            case 'video':
                return <VideoProperties data={block.data} onChange={onUpdate} />;
            case 'html':
                return <HtmlProperties data={block.data} onChange={onUpdate} />;
            case 'timer':
                return <TimerProperties data={block.data} onChange={onUpdate} />;
            default:
                return <div>No properties available</div>;
        }
    };

    return (
        <div className="properties-panel">
            <div className="panel-header">
                <h3>Block Settings</h3>
                <button className="panel-close-btn" onClick={onClose}>×</button>
            </div>
            <div className="panel-content">
                {renderProperties()}
            </div>
        </div>
    );
};

// Text Properties
const TextProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Text Content</label>
        <textarea
            value={data.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={6}
            className="property-textarea"
        />
        <label>Font Size</label>
        <input
            type="text"
            value={data.fontSize}
            onChange={(e) => onChange({ fontSize: e.target.value })}
            className="property-input"
        />
        <label>Text Color</label>
        <input
            type="color"
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="property-color"
        />
        <label>Alignment</label>
        <select
            value={data.align}
            onChange={(e) => onChange({ align: e.target.value })}
            className="property-select"
        >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
        </select>
    </div>
);

// Heading Properties
const HeadingProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Heading Text</label>
        <input
            type="text"
            value={data.content}
            onChange={(e) => onChange({ content: e.target.value })}
            className="property-input"
        />
        <label>Heading Level</label>
        <select
            value={data.level}
            onChange={(e) => onChange({ level: e.target.value })}
            className="property-select"
        >
            <option value="h1">H1 (Largest)</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4 (Smallest)</option>
        </select>
        <label>Font Size</label>
        <input
            type="text"
            value={data.fontSize}
            onChange={(e) => onChange({ fontSize: e.target.value })}
            className="property-input"
        />
        <label>Text Color</label>
        <input
            type="color"
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="property-color"
        />
        <label>Alignment</label>
        <select
            value={data.align}
            onChange={(e) => onChange({ align: e.target.value })}
            className="property-select"
        >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
        </select>
    </div>
);

// Button Properties
const ButtonProperties = ({ data, onChange, brandingData }) => (
    <div className="property-group">
        <label>Button Text</label>
        <input
            type="text"
            value={data.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="property-input"
        />
        <label>Link URL</label>
        <input
            type="url"
            value={data.url}
            onChange={(e) => onChange({ url: e.target.value })}
            className="property-input"
            placeholder="https://example.com"
        />
        <label>Background Color</label>
        <div className="color-picker-group">
            <input
                type="color"
                value={data.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="property-color"
            />
            {brandingData && (
                <button
                    className="brand-color-btn"
                    onClick={() => onChange({ backgroundColor: brandingData.primaryColor })}
                    title="Use brand color"
                >
                    Use Brand Color
                </button>
            )}
        </div>
        <label>Text Color</label>
        <input
            type="color"
            value={data.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="property-color"
        />
        <label>Border Radius</label>
        <input
            type="text"
            value={data.borderRadius}
            onChange={(e) => onChange({ borderRadius: e.target.value })}
            className="property-input"
            placeholder="8px"
        />
        <label>Alignment</label>
        <select
            value={data.align}
            onChange={(e) => onChange({ align: e.target.value })}
            className="property-select"
        >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
        </select>
    </div>
);

// Image Properties
// Image Properties
const ImageProperties = ({ data, onChange }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP, SVG).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size too large. Maximum size is 5MB.');
            return;
        }

        try {
            setUploading(true);
            const data = await firmAdminEmailTemplatesAPI.uploadAsset(file);
            if (data && data.url) {
                onChange({ url: data.url });
                toast.success('Image uploaded successfully');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="property-group">
            <label>Image Source</label>
            <div className="image-upload-control" style={{ marginBottom: '15px' }}>
                <input
                    type="url"
                    value={data.url}
                    onChange={(e) => onChange({ url: e.target.value })}
                    className="property-input"
                    placeholder="https://example.com/image.jpg"
                    style={{ marginBottom: '8px' }}
                />

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn-upload"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        style={{
                            padding: '6px 12px',
                            background: '#f0f4ff',
                            color: '#1f2a55',
                            border: '1px solid #dde5ff',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: uploading ? 'wait' : 'pointer',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                        {!uploading && <span>⬆️</span>}
                    </button>
                </div>
            </div>

            <label>Alt Text</label>
            <input
                type="text"
                value={data.alt}
                onChange={(e) => onChange({ alt: e.target.value })}
                className="property-input"
            />
            <label>Width</label>
            <input
                type="text"
                value={data.width}
                onChange={(e) => onChange({ width: e.target.value })}
                className="property-input"
                placeholder="100% or 600px"
            />
            <label>Alignment</label>
            <select
                value={data.align}
                onChange={(e) => onChange({ align: e.target.value })}
                className="property-select"
            >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </select>
            <label>Link URL (optional)</label>
            <input
                type="url"
                value={data.link}
                onChange={(e) => onChange({ link: e.target.value })}
                className="property-input"
                placeholder="https://example.com"
            />
        </div>
    );
};

// Logo Properties
const LogoProperties = ({ data, onChange, firmData }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP, SVG).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size too large. Maximum size is 5MB.');
            return;
        }

        try {
            setUploading(true);
            const data = await firmAdminEmailTemplatesAPI.uploadAsset(file);
            if (data && data.url) {
                onChange({ url: data.url });
                toast.success('Logo uploaded successfully');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload logo. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="property-group">
            <label>Logo Source</label>
            <div className="image-upload-control" style={{ marginBottom: '15px' }}>
                <input
                    type="url"
                    value={data.url}
                    onChange={(e) => onChange({ url: e.target.value })}
                    className="property-input"
                    placeholder="https://example.com/logo.png"
                    style={{ marginBottom: '8px' }}
                />

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn-upload"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        style={{
                            padding: '6px 12px',
                            background: '#f0f4ff',
                            color: '#1f2a55',
                            border: '1px solid #dde5ff',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: uploading ? 'wait' : 'pointer',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
                        {!uploading && <span>⬆️</span>}
                    </button>

                    {firmData?.logo_url && (
                        <button
                            className="use-firm-logo-btn"
                            onClick={() => onChange({ url: firmData.logo_url })}
                            style={{
                                padding: '6px 12px',
                                background: '#FFF5F2',
                                color: '#F56D2D',
                                border: '1px solid #F56D2D',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            Use Firm Logo
                        </button>
                    )}
                </div>
            </div>

            <label>Width</label>
            <input
                type="text"
                value={data.width}
                onChange={(e) => onChange({ width: e.target.value })}
                className="property-input"
                placeholder="200px"
            />
            <label>Alignment</label>
            <select
                value={data.align}
                onChange={(e) => onChange({ align: e.target.value })}
                className="property-select"
            >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </select>
        </div>
    );
};

// Divider Properties
const DividerProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Style</label>
        <select
            value={data.style}
            onChange={(e) => onChange({ style: e.target.value })}
            className="property-select"
        >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
        </select>
        <label>Color</label>
        <input
            type="color"
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="property-color"
        />
        <label>Thickness</label>
        <input
            type="text"
            value={data.thickness}
            onChange={(e) => onChange({ thickness: e.target.value })}
            className="property-input"
            placeholder="1px"
        />
        <label>Spacing (top/bottom)</label>
        <input
            type="text"
            value={data.spacing}
            onChange={(e) => onChange({ spacing: e.target.value })}
            className="property-input"
            placeholder="20px"
        />
    </div>
);

// Social Icons Properties
const SocialProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Social Media Links</label>
        {data.icons.map((icon, index) => (
            <div key={icon.platform} className="social-link-input">
                <span className="social-platform">{icon.platform}</span>
                <input
                    type="url"
                    value={icon.url}
                    onChange={(e) => {
                        const newIcons = [...data.icons];
                        newIcons[index].url = e.target.value;
                        onChange({ icons: newIcons });
                    }}
                    className="property-input"
                    placeholder={`https://${icon.platform}.com/yourpage`}
                />
            </div>
        ))}
        <label>Icon Size</label>
        <input
            type="text"
            value={data.iconSize}
            onChange={(e) => onChange({ iconSize: e.target.value })}
            className="property-input"
            placeholder="32px"
        />
        <label>Alignment</label>
        <select
            value={data.align}
            onChange={(e) => onChange({ align: e.target.value })}
            className="property-select"
        >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
        </select>
    </div>
);

// Signature Properties
const SignatureProperties = ({ data, onChange, firmData }) => (
    <div className="property-group">
        <button
            className="use-firm-data-btn"
            onClick={() => onChange({
                firmName: firmData?.name || data.firmName,
                address: firmData?.address || data.address,
                phone: firmData?.phone_number || data.phone,
                email: firmData?.email || data.email,
                website: firmData?.website || data.website,
            })}
        >
            Use Firm Information
        </button>
        <label>Firm Name</label>
        <input
            type="text"
            value={data.firmName}
            onChange={(e) => onChange({ firmName: e.target.value })}
            className="property-input"
        />
        <label>Address</label>
        <textarea
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            rows={3}
            className="property-textarea"
        />
        <label>Phone</label>
        <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="property-input"
        />
        <label>Email</label>
        <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="property-input"
        />
        <label>Website</label>
        <input
            type="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            className="property-input"
        />
    </div>
);

// Menu Properties
const MenuProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Menu Items</label>
        {data.items.map((item, index) => (
            <div key={index} className="menu-item-input">
                <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                        const newItems = [...data.items];
                        newItems[index].text = e.target.value;
                        onChange({ items: newItems });
                    }}
                    className="property-input"
                    placeholder="Link text"
                />
                <input
                    type="url"
                    value={item.url}
                    onChange={(e) => {
                        const newItems = [...data.items];
                        newItems[index].url = e.target.value;
                        onChange({ items: newItems });
                    }}
                    className="property-input"
                    placeholder="https://..."
                />
            </div>
        ))}
        <button
            className="add-menu-item-btn"
            onClick={() => onChange({
                items: [...data.items, { text: 'New Link', url: '#' }]
            })}
        >
            + Add Menu Item
        </button>
    </div>
);

// Video Properties
const VideoProperties = ({ data, onChange }) => {
    const handleUrlChange = (e) => {
        const newUrl = e.target.value;
        const updates = { url: newUrl };
        
        // Auto-generate thumbnail for YouTube if not already set
        if (newUrl && !data.thumbnail) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = newUrl.match(regExp);
            if (match && match[2].length === 11) {
                updates.thumbnail = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
            }
        }
        
        onChange(updates);
    };

    return (
        <div className="property-group">
            <label>Video URL (YouTube or Vimeo)</label>
            <input
                type="url"
                value={data.url}
                onChange={handleUrlChange}
                className="property-input"
                placeholder="https://youtube.com/watch?v=..."
            />
            <label>Thumbnail Image (optional)</label>
            <input
                type="url"
                value={data.thumbnail}
                onChange={(e) => onChange({ thumbnail: e.target.value })}
                className="property-input"
                placeholder="https://..."
            />
            {data.thumbnail && (
                <div style={{ marginTop: '10px' }}>
                    <label>Preview</label>
                    <img 
                        src={data.thumbnail} 
                        alt="Thumbnail preview" 
                        style={{ width: '100%', borderRadius: '4px', objectFit: 'cover' }} 
                    />
                </div>
            )}
        </div>
    );
};

// HTML Properties
const HtmlProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Custom HTML</label>
        <textarea
            value={data.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={12}
            className="property-textarea code"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
    </div>
);

// Timer Properties
const TimerProperties = ({ data, onChange }) => (
    <div className="property-group">
        <label>Title</label>
        <input
            type="text"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="property-input"
        />
        <label>End Date & Time</label>
        <input
            type="datetime-local"
            value={data.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="property-input"
        />
        <label>Text Color</label>
        <input
            type="color"
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="property-color"
        />
    </div>
);

export default PropertiesPanel;
